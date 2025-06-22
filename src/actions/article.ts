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

// Database ---
import { createArticleRecord } from "@/db/dal";
import { Article } from "@/db/schema";

/* ==========================================================================*/
// Types
/* ==========================================================================*/

interface CreateNewVersionResult {
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
export async function createNewVersionAction(
  currentArticle: Article,
  updates: Partial<Article>
): Promise<CreateNewVersionResult> {
  console.log("🚀 createNewVersionAction called with:", { 
    articleId: currentArticle.id, 
    slug: currentArticle.slug,
    currentVersion: currentArticle.version,
    updates 
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
      headline: updates.headline || currentArticle.headline || '',
      source: {
        description: currentArticle.inputSourceDescription || '',
        accredit: currentArticle.inputSourceAccredit || '',
        sourceText: currentArticle.inputSourceText || '',
        verbatim: currentArticle.inputSourceVerbatim || false,
        primary: currentArticle.inputSourcePrimary || false,
      },
      instructions: {
        instructions: currentArticle.inputPresetInstructions || '',
        blobs: currentArticle.inputPresetBlobs || '1',
        length: currentArticle.inputPresetLength || '700-850',
      }
    };

    console.log("📝 Creating new version with data:", newVersionData);

    // Create the new article version
    const newArticle = await createArticleRecord(newVersionData);
    
    console.log("✅ New article version created with ID:", newArticle.id);

    // Update the new article with any additional changes
    const fieldsToUpdate = {
      ...(updates.blob !== undefined && { blob: updates.blob }),
      ...(updates.content !== undefined && { content: updates.content }),
      ...(updates.sentences !== undefined && { sentences: updates.sentences }),
      ...(updates.status !== undefined && { status: updates.status }),
      ...(updates.headline !== undefined && { headline: updates.headline }),
    };

    if (Object.keys(fieldsToUpdate).length > 0) {
      console.log("📝 Updating new article with additional fields:", fieldsToUpdate);
      const { updateArticle } = await import("@/db/dal");
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
      error: error instanceof Error ? error.message : "Failed to create new version"
    };
  }
}
