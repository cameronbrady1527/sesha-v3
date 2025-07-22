"use server";

/* ==========================================================================*/
// article.ts — Server actions for article operations
/* ==========================================================================*/
// Purpose: Server actions for CRUD operations on articles
// Sections: Imports, Types, Actions, Exports

/* ==========================================================================*/
// Imports
/* ==========================================================================*/

// Next.js core ---
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

// Authentication ---
import { getAuthenticatedUserServer } from "@/lib/supabase/server";

// Utils ---
import { extractSourcesFromArticle } from "@/lib/utils";

// DAL ---
import { createArticleRecord, updateArticle, getOrgArticlesMetadataPaginated, getOrgArticlesCount, getArticleByOrgSlugVersion, archiveArticle, unarchiveArticle } from "@/db/dal";

import type { ArticleMetadata } from "@/db/dal";

// Schema ---
import { Article } from "@/db/schema";

/* ==========================================================================*/
// Types
/* ==========================================================================*/

interface CreateNewVersionResult {
  success: boolean;
  article?: Article;
  error?: string;
}

interface LoadArticlesResult {
  success: boolean;
  articles: ArticleMetadata[];
  totalCount: number;
  error?: string;
}

interface CheckArticleStatusResult {
  success: boolean;
  article?: Article;
  error?: string;
}

/* ==========================================================================*/
// Actions
/* ==========================================================================*/

/**
 * createNewVersionAction
 *
 * Server action to create a new version of an article with updated data.
 * Requires authentication and redirects to the new version.
 *
 * @param currentArticle - The current article to create a new version from
 * @param updates - Updated fields for the new version
 * @returns Success/error result with new article data
 */
export async function createNewVersionAction(currentArticle: Article, updates: Partial<Article>): Promise<CreateNewVersionResult> {
  console.log("🚀 createNewVersionAction called with:", {
    articleId: currentArticle.id,
    slug: currentArticle.slug,
    currentVersion: currentArticle.version,
    updates,
  });

  try {
    // Authentication check
    const user = await getAuthenticatedUserServer();
    if (!user) {
      console.log("❌ No authenticated user, redirecting to login");
      redirect("/login");
    }

    console.log("✅ User authenticated:", user.id);

    // Prepare the new version data by merging current article with updates
    const newVersionData = {
      metadata: {
        userId: user.id,
        orgId: user.orgId.toString(),
        currentVersion: currentArticle.version, // This will increment to currentVersion + 1
      },
      slug: currentArticle.slug,
      headline: updates.headline || currentArticle.headline || "",
      sources: extractSourcesFromArticle(currentArticle),
      instructions: {
        instructions: currentArticle.inputPresetInstructions || "",
        blobs: currentArticle.inputPresetBlobs || "1",
        length: currentArticle.inputPresetLength || "700-850",
      },
    };

    console.log("📝 Creating new version with data:", newVersionData);

    // Create the new article version
    const newArticle = await createArticleRecord(newVersionData);

    console.log("✅ New article version created with ID:", newArticle.id);

    // Update the new article with any additional changes
    const fieldsToUpdate = {
      ...(updates.blob !== undefined && { blob: updates.blob }),
      ...(updates.content !== undefined && { content: updates.content }),
      ...(updates.status !== undefined && { status: updates.status }),
      ...(updates.headline !== undefined && { headline: updates.headline }),
    };

    if (Object.keys(fieldsToUpdate).length > 0) {
      console.log("📝 Updating new article with additional fields:", fieldsToUpdate);
      await updateArticle(newArticle.id, user.id, fieldsToUpdate);
    }

    // Revalidate the article page to show the new version
    console.log("🔄 Revalidating path:", `/article?slug=${currentArticle.slug}`);
    revalidatePath(`/article?slug=${currentArticle.slug}`);

    return {
      success: true,
      article: newArticle,
    };

    // Redirect to the new version
    // redirect(`/article?slug=${currentArticle.slug}&version=${currentArticle.version + 1}`);
  } catch (error) {
    console.error("❌ createNewVersionAction failed with error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create new version",
    };
  }
}

/**
 * loadArticlesAction
 *
 * Server action to load paginated article metadata for infinite scroll.
 *
 * @param offset - Number of articles to skip
 * @param limit - Number of articles to load (default 50)
 * @returns Articles data with pagination info
 */
export async function loadArticlesAction(offset: number = 0, limit: number = 50): Promise<LoadArticlesResult> {
  try {
    // Authentication check
    const user = await getAuthenticatedUserServer();
    if (!user) {
      redirect("/login");
    }

    // Load articles with pagination
    const articles = await getOrgArticlesMetadataPaginated(user.orgId, limit, offset);
    const totalCount = await getOrgArticlesCount(user.orgId);

    return {
      success: true,
      articles,
      totalCount,
    };
  } catch (error) {
    console.error("❌ loadArticlesAction failed:", error);
    return {
      success: false,
      articles: [],
      totalCount: 0,
      error: error instanceof Error ? error.message : "Failed to load articles",
    };
  }
}

/**
 * checkArticleStatusAction
 *
 * Server action to check the current status of an article by slug and version.
 * Used for live polling of articles with running statuses.
 *
 * @param slug - The article slug
 * @param version - The article version
 * @returns Current article data or error
 */
export async function checkArticleStatusAction(slug: string, version: number): Promise<CheckArticleStatusResult> {
  try {
    // Authentication check
    const user = await getAuthenticatedUserServer();
    if (!user) {
      redirect("/login");
    }

    // Get the current article status
    const article = await getArticleByOrgSlugVersion(user.orgId, slug, version);

    if (!article) {
      return {
        success: false,
        error: "Article not found",
      };
    }

    return {
      success: true,
      article,
    };
  } catch (error) {
    console.error("❌ checkArticleStatusAction failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to check article status",
    };
  }
}

/**
 * archiveArticleAction
 *
 * Server action to archive an article by setting its status to 'archived'.
 *
 * @param articleId - The article ID to archive
 * @returns Success/error result
 */
export async function archiveArticleAction(articleId: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Authentication check
    const user = await getAuthenticatedUserServer();
    if (!user) {
      redirect("/login");
    }

    // Archive the article
    const result = await archiveArticle(articleId, user.id);

    if (result) {
      // Revalidate library page to reflect changes
      revalidatePath("/library");

      return { success: true };
    } else {
      return { success: false, error: "Article not found" };
    }
  } catch (error) {
    console.error("❌ archiveArticleAction failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to archive article",
    };
  }
}

/**
 * unarchiveArticleAction
 *
 * Server action to unarchive an article by setting its status to 'completed'.
 *
 * @param articleId - The article ID to unarchive
 * @returns Success/error result
 */
export async function unarchiveArticleAction(articleId: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Authentication check
    const user = await getAuthenticatedUserServer();
    if (!user) {
      redirect("/login");
    }

    // Unarchive the article
    const result = await unarchiveArticle(articleId, user.id);

    if (result) {
      // Revalidate library page to reflect changes
      revalidatePath("/library");

      return { success: true };
    } else {
      return { success: false, error: "Article not found" };
    }
  } catch (error) {
    console.error("❌ unarchiveArticleAction failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to unarchive article",
    };
  }
}
