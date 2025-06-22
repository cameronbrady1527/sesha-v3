// dal.ts — Minimal data-access layer built on Drizzle ORM
// -----------------------------------------------------------------------------
// This file exposes small, typed helper functions so the rest of the codebase
// never needs to write SQL. Each helper wraps a single Drizzle query.
// -----------------------------------------------------------------------------
// Requirements covered:
// • CRUD operations for users
// • Create / update for sources
// • Fetch article metadata
// • Fetch article-version metadata list
// • Fetch full article by (orgId, slug, version)
// -----------------------------------------------------------------------------

import { db } from "./index";

import { users, articles, runs, organizations, presets } from "./schema";

import type { NewUser, User, Preset, Article, ArticleStatus, RunType, Organization, NewPreset, BlobsCount, LengthRange } from "./schema";

import { eq, and, sql, desc } from "drizzle-orm";

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

/** Shape returned by `getArticleMetadata()` — a trimmed-down view. */
export interface ArticleMetadata {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  version: number;
  createdByName: string;
  slug: string;
  headline: string | null;
  status: ArticleStatus;
}

/** Sidebar list item for an article version. */
export interface ArticleVersionMetadata {
  version: number;
  slug: string | null;
  headline: string | null;
  createdAt: Date;
}

/** Raw run row shape returned by `getOrgRuns()` */
export interface RunRow {
  id: string;
  articleId: string | null;
  userId: string | null;
  runType: RunType;
  length: string;
  costUsd: number;
  tokensUsed: number | null;
  createdAt: Date;
}

export interface SpendSummary {
  totalRuns: number;
  totalCostUsd: number;
  avgCostPerRun: number;
}

/* -------------------------------------------------------------------------- */
/*  User helpers                                                              */
/* -------------------------------------------------------------------------- */

/**
 * Insert a new user.
 * @param payload Partial user record. `id`, `createdAt`, `updatedAt` are auto-filled.
 * @returns Inserted row.
 */
export async function createUser(payload: Omit<NewUser, "id" | "createdAt" | "updatedAt">): Promise<User> {
  const [row] = await db.insert(users).values(payload).returning();
  return row;
}

/**
 * Fetch a single user by UUID.
 */
export async function getUser(id: string): Promise<User | undefined> {
  const [row] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return row;
}

/**
 * Update an existing user.
 * @param id The user UUID.
 * @param updates Partial user fields to patch.
 * @returns Updated row.
 */
export async function updateUser(id: string, updates: Partial<Omit<NewUser, "id" | "createdAt" | "updatedAt">>): Promise<User | undefined> {
  const [row] = await db
    .update(users)
    .set({ ...updates, updatedAt: new Date() })
    .where(eq(users.id, id))
    .returning();
  return row;
}

/**
 * Delete a user (hard delete).
 * @returns Number of rows removed (0 | 1).
 */
export async function deleteUser(id: string): Promise<number> {
  const result = await db.delete(users).where(eq(users.id, id)).returning();
  return result.length;
}

/* -------------------------------------------------------------------------- */
/*  Article metadata                                                          */
/* -------------------------------------------------------------------------- */

/**
 * Fetch top-level metadata for a single article.
 */
export async function getArticleMetadata(articleId: string): Promise<ArticleMetadata | undefined> {
  const [row] = await db
    .select({
      id: articles.id,
      createdAt: articles.createdAt,
      updatedAt: articles.updatedAt,
      version: articles.version,
      createdByName: sql<string>`
        CASE 
          WHEN ${users.firstName} IS NOT NULL AND ${users.lastName} IS NOT NULL 
          THEN CONCAT(${users.firstName}, ' ', ${users.lastName})
          ELSE ${users.email}
        END
      `.as("createdByName"),
      slug: articles.slug,
      headline: articles.headline,
      status: articles.status,
    })
    .from(articles)
    .leftJoin(users, eq(articles.createdBy, users.id))
    .where(eq(articles.id, articleId))
    .limit(1);

  return row;
}

/* -------------------------------------------------------------------------- */
/*  Article metadata pagination                                                  */
/* -------------------------------------------------------------------------- */

/**
 * Paginated list of article metadata for a given organisation.
 * Pass `offset` and `limit` for infinite‑scroll style pagination.
 */
export async function getOrgArticlesMetadataPaginated(orgId: number, limit = 50, offset = 0): Promise<ArticleMetadata[]> {
  return db
    .select({
      id: articles.id,
      createdAt: articles.createdAt,
      updatedAt: articles.updatedAt,
      version: articles.version,
      createdByName: sql<string>`
        CASE 
          WHEN ${users.firstName} IS NOT NULL AND ${users.lastName} IS NOT NULL 
          THEN CONCAT(${users.firstName}, ' ', ${users.lastName})
          ELSE ${users.email}
        END
      `.as("createdByName"),
      slug: articles.slug,
      headline: articles.headline,
      status: articles.status,
    })
    .from(articles)
    .leftJoin(users, eq(articles.createdBy, users.id))
    .where(eq(articles.orgId, orgId))
    .orderBy(articles.createdAt)
    .limit(limit)
    .offset(offset);
}

/**
 * Total count of articles for an organisation — handy for pagination UIs.
 */
export async function getOrgArticlesCount(orgId: number): Promise<number> {
  const [row] = await db
    .select({ count: sql<number>`count(*)` })
    .from(articles)
    .where(eq(articles.orgId, orgId));
  return row?.count ?? 0;
}

/* -------------------------------------------------------------------------- */
/*  Article-version list                                                      */
/* -------------------------------------------------------------------------- */

/**
 * Return a list of all version metadata for an article (for a sidebar list).
 */
export async function getArticleVersionsMetadata(articleId: string): Promise<ArticleVersionMetadata[]> {
  return db
    .select({
      version: articles.version,
      slug: articles.slug,
      headline: articles.headline,
      createdAt: articles.createdAt,
    })
    .from(articles)
    .where(eq(articles.id, articleId))
    .orderBy(articles.version);
}

/* -------------------------------------------------------------------------- */
/*  Fetch article by (orgId, slug, version)                                   */
/* -------------------------------------------------------------------------- */

/**
 * Fetch an article (with version content) given its org, slug, and version.
 * If `version` is omitted it resolves to the article's currentVersion.
 */
export async function getArticleByOrgSlugVersion(orgId: number, slug: string, version?: number): Promise<Article | null> {
  // 1) Find the article row first
  const [article] = await db
    .select()
    .from(articles)
    .where(and(eq(articles.orgId, orgId), eq(articles.slug, slug), eq(articles.version, version ?? 1)))
    .limit(1);

  if (!article) return null;

  return article;
}

/**
 * Fetch all articles with the same slug across all versions for an organization.
 * Returns articles ordered by version descending (newest first) with creator information.
 */
export async function getArticlesByOrgSlug(orgId: number, slug: string): Promise<(Article & { createdByName: string })[]> {
  return db
    .select({
      // All article fields
      id: articles.id,
      orgId: articles.orgId,
      slug: articles.slug,
      version: articles.version,
      headline: articles.headline,
      blob: articles.blob,
      content: articles.content,
      sentences: articles.sentences,
      changeDescription: articles.changeDescription,
      inputSourceText: articles.inputSourceText,
      inputSourceDescription: articles.inputSourceDescription,
      inputSourceAccredit: articles.inputSourceAccredit,
      inputSourceVerbatim: articles.inputSourceVerbatim,
      inputSourcePrimary: articles.inputSourcePrimary,
      inputPresetTitle: articles.inputPresetTitle,
      inputPresetInstructions: articles.inputPresetInstructions,
      inputPresetBlobs: articles.inputPresetBlobs,
      inputPresetLength: articles.inputPresetLength,
      status: articles.status,
      createdBy: articles.createdBy,
      updatedBy: articles.updatedBy,
      createdAt: articles.createdAt,
      updatedAt: articles.updatedAt,
      // Computed user display name
      createdByName: sql<string>`
        CASE 
          WHEN ${users.firstName} IS NOT NULL AND ${users.lastName} IS NOT NULL 
          THEN CONCAT(${users.firstName}, ' ', ${users.lastName})
          ELSE ${users.email}
        END
      `.as("createdByName"),
    })
    .from(articles)
    .leftJoin(users, eq(articles.createdBy, users.id))
    .where(and(eq(articles.orgId, orgId), eq(articles.slug, slug)))
    .orderBy(desc(articles.version));
}

/* ==========================================================================*/
// Runs & Spend (no filters)
/* ==========================================================================*/

/** All run rows for an organisation — let the UI filter/group as needed. */
export async function getOrgRuns(orgId: number): Promise<RunRow[]> {
  return db
    .select({
      id: runs.id,
      articleId: runs.articleId,
      userId: runs.userId,
      runType: runs.runType,
      length: runs.length,
      costUsd: sql<number>`${runs.costUsd}::numeric`.as("costUsd"),
      tokensUsed: runs.tokensUsed,
      createdAt: runs.createdAt,
    })
    .from(runs)
    .innerJoin(articles, eq(runs.articleId, articles.id))
    .where(eq(articles.orgId, orgId));
}

/** Simple spend summary for an organisation (no extra filters). */
export async function getOrgSpendSummary(orgId: number): Promise<SpendSummary> {
  const [row] = await db
    .select({
      totalRuns: sql<number>`count(*)`,
      totalCostUsd: sql<number>`coalesce(sum(${runs.costUsd}), 0)`,
      avgCostPerRun: sql<number>`coalesce(avg(${runs.costUsd}), 0)`,
    })
    .from(runs)
    .innerJoin(articles, eq(runs.articleId, articles.id))
    .where(eq(articles.orgId, orgId));

  return {
    totalRuns: row?.totalRuns ?? 0,
    totalCostUsd: Number(row?.totalCostUsd ?? 0),
    avgCostPerRun: Number(row?.avgCostPerRun ?? 0),
  };
}

/* -------------------------------------------------------------------------- */
/*  Organization helpers                                                      */
/* -------------------------------------------------------------------------- */

/**
 * Fetch a single organization by ID.
 */
export async function getOrganization(id: number): Promise<Organization | undefined> {
  const [row] = await db.select().from(organizations).where(eq(organizations.id, id)).limit(1);
  return row;
}

/* -------------------------------------------------------------------------- */
/*  Preset helpers                                                            */
/* -------------------------------------------------------------------------- */

/**
 * Create a new preset for an organisation.
 */
export async function createPreset(payload: Omit<NewPreset, "id" | "createdAt" | "updatedAt">): Promise<Preset> {
  const [row] = await db.insert(presets).values(payload).returning();
  return row;
}

/**
 * Update an existing preset.
 */
export async function updatePreset(id: string, updates: Partial<Omit<NewPreset, "id" | "createdAt" | "updatedAt">>): Promise<Preset | undefined> {
  const [row] = await db
    .update(presets)
    .set({ ...updates, updatedAt: new Date() })
    .where(eq(presets.id, id))
    .returning();
  return row;
}

/**
 * Get All Presets for an organisation.
 */
export async function getOrgPresets(orgId: number): Promise<Preset[]> {
  return db.select().from(presets).where(eq(presets.orgId, orgId));
}

/* -------------------------------------------------------------------------- */
/*  Article Inputs helpers                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Fetch article inputs by organization, slug, and version.
 * This returns the original form data used to create the article version.
 *
 * @param orgId - Organization ID
 * @param slug - Article slug
 * @param version - Version number (defaults to current version if not provided)
 * @returns Article's input fields or null if not found
 */
export async function getArticleInputsByOrgSlugVersion(orgId: number, slug: string, version?: number): Promise<Partial<Article> | null> {
  // 1) Find the article row first
  const [article] = await db
    .select()
    .from(articles)
    .where(and(eq(articles.orgId, orgId), eq(articles.slug, slug), eq(articles.version, version ?? 1)))
    .limit(1);

  if (!article) return null;

  return article;
}

/* -------------------------------------------------------------------------- */
/*  Pipeline Database Operations                                              */
/* -------------------------------------------------------------------------- */

/**
 * Create a new article record with all input and output fields.
 * Always creates a new row - no complex transaction logic needed.
 * Handles version conflicts by automatically incrementing version on duplicate key violations.
 *
 * @param payload - Article creation payload with all data
 * @returns The article ID for use in subsequent pipeline steps
 */
export async function createArticleRecord(payload: {
  metadata: {
    userId: string;
    orgId: string;
    currentVersion: number | null;
  };
  slug: string;
  headline: string;
  source: {
    description: string;
    accredit: string;
    sourceText: string;
    verbatim: boolean;
    primary: boolean;
  };
  instructions: {
    instructions: string;
    blobs: BlobsCount;
    length: LengthRange;
  };
}): Promise<Article> {
  const orgId = parseInt(payload.metadata.orgId);

  return await db.transaction(async (tx) => {
    // Lock and get the current highest version for this slug
    const [currentHighest] = await tx
      .select({ version: articles.version })
      .from(articles)
      .where(and(eq(articles.orgId, orgId), eq(articles.slug, payload.slug)))
      .orderBy(desc(articles.version))
      .limit(1)
      .for("update"); // This locks the row(s) until transaction commits

    const nextVersion = (currentHighest?.version || 0) + 1;

    // Now create the new article with the calculated version
    const [article] = await tx
      .insert(articles)
      .values({
        orgId,
        slug: payload.slug,
        version: nextVersion,
        headline: payload.headline,
        status: "processing",

        // Input snapshot fields
        inputSourceText: payload.source.sourceText,
        inputSourceDescription: payload.source.description,
        inputSourceAccredit: payload.source.accredit,
        inputSourceVerbatim: payload.source.verbatim,
        inputSourcePrimary: payload.source.primary,
        inputPresetInstructions: payload.instructions.instructions,
        inputPresetBlobs: payload.instructions.blobs,
        inputPresetLength: payload.instructions.length,

        // Audit fields
        createdBy: payload.metadata.userId,
        updatedBy: payload.metadata.userId,
      })
      .returning();

    if (!article) {
      throw new Error("Failed to create article");
    }

    return article;
  });
}

/**
 * Update article with final pipeline results.
 * Simply sets the status and stores the generated content.
 *
 * @param articleId - The article ID to update
 * @param userId - User ID for audit trail
 * @param isSuccessful - Whether the pipeline completed successfully
 * @param headline - Generated headline from step 3
 * @param blobs - Generated blobs from step 3
 * @param formattedArticle - Final formatted article from step 7
 */
export async function updateArticleWithResults(articleId: string, userId: string, isSuccessful: boolean, headline: string, blobs: string[], formattedArticle: string, sentences: string[]): Promise<void> {
  await db
    .update(articles)
    .set({
      status: isSuccessful ? "published" : "failed",
      headline: isSuccessful ? headline : null,
      blob: isSuccessful ? blobs.join("\n") : null,
      content: isSuccessful ? formattedArticle : null,
      sentences: isSuccessful ? sentences : null,
      updatedBy: userId,
      updatedAt: new Date(),
    })
    .where(eq(articles.id, articleId));
}

/**
 * Update an existing article with partial data.
 *
 * @param articleId - The article ID to update
 * @param userId - User ID for audit trail
 * @param updates - Partial article fields to update
 * @returns Updated article or null if not found
 */
export async function updateArticle(articleId: string, userId: string, updates: Partial<Pick<Article, "headline" | "blob" | "content" | "sentences" | "status">>): Promise<Article | null> {
  console.log("🗄️ updateArticle called with:", { articleId, userId, updates });

  try {
    const updateData = {
      ...updates,
      updatedBy: userId,
      updatedAt: new Date(),
    };

    console.log("📝 Executing database update with:", updateData);

    const [updatedArticle] = await db.update(articles).set(updateData).where(eq(articles.id, articleId)).returning();

    console.log("📊 Database update result:", updatedArticle ? "Article updated" : "No article found");

    if (updatedArticle) {
      console.log("✅ Updated article:", {
        id: updatedArticle.id,
        headline: updatedArticle.headline,
        blob: updatedArticle.blob ? `${updatedArticle.blob.substring(0, 50)}...` : null,
        updatedAt: updatedArticle.updatedAt,
      });
    }

    return updatedArticle || null;
  } catch (error) {
    console.error("❌ Database update failed:", error);
    throw error;
  }
}
