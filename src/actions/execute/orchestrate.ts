"use server";

/* ==========================================================================*/
// orchestrate.ts — Pipeline orchestration and routing
/* ==========================================================================*/
// Purpose: Route article pipeline execution based on source type
// Sections: Imports, Types, Helper Functions, Pipeline Router, Exports

/* ==========================================================================*/
// Imports
/* ==========================================================================*/

// Core Modules ---
import "server-only";

// Local Database ----
import { getArticleById, updateArticleStatus } from "@/db/dal";

// Local Pipeline Functions ----
import { runDigestPipeline } from "./digest";
import { runAggregatePipeline } from "./aggregate";

// Local Types ----
import type { DigestRequest } from "@/types/digest";
import type { AggregateRequest } from "@/types/aggregate";
import type { Article } from "@/db/schema";

/* ==========================================================================*/
// Types
/* ==========================================================================*/

interface PipelineExecutionResult {
  success: boolean;
  error?: string;
  articleId?: string;
}

/* ==========================================================================*/
// Helper Functions
/* ==========================================================================*/

/**
 * buildDigestRequestFromArticle
 * 
 * Build a DigestRequest from an article record for single-source processing.
 * 
 * @param article - Complete article record from database
 * @returns DigestRequest for pipeline execution
 */
function buildDigestRequestFromArticle(article: Article): DigestRequest {
  return {
    metadata: {
      userId: article.createdBy || "",
      orgId: article.orgId.toString(),
      currentVersion: article.version,
    },
    slug: article.slug,
    headline: article.headline || "",
    source: {
      description: article.inputSourceDescription1 || "",
      accredit: article.inputSourceAccredit1 || "",
      sourceText: article.inputSourceText1,
      verbatim: article.inputSourceVerbatim1,
      primary: article.inputSourcePrimary1,
    },
    instructions: {
      instructions: article.inputPresetInstructions,
      blobs: article.inputPresetBlobs,
      length: article.inputPresetLength,
    },
  };
}

/**
 * buildAggregateRequestFromArticle
 * 
 * Build an AggregateRequest from an article record for multi-source processing.
 * 
 * @param article - Complete article record from database
 * @returns AggregateRequest for pipeline execution
 */
function buildAggregateRequestFromArticle(article: Article): AggregateRequest {
  // Collect all non-null sources
  const sources = [];
  
  // Source 1 (always present)
  if (article.inputSourceText1) {
    sources.push({
      description: article.inputSourceDescription1 || "",
      accredit: article.inputSourceAccredit1 || "",
      sourceText: article.inputSourceText1,
      verbatim: article.inputSourceVerbatim1,
      primary: article.inputSourcePrimary1,
    });
  }
  
  // Source 2
  if (article.inputSourceText2) {
    sources.push({
      description: article.inputSourceDescription2 || "",
      accredit: article.inputSourceAccredit2 || "",
      sourceText: article.inputSourceText2,
      verbatim: article.inputSourceVerbatim2 || false,
      primary: article.inputSourcePrimary2 || false,
    });
  }
  
  // Source 3
  if (article.inputSourceText3) {
    sources.push({
      description: article.inputSourceDescription3 || "",
      accredit: article.inputSourceAccredit3 || "",
      sourceText: article.inputSourceText3,
      verbatim: article.inputSourceVerbatim3 || false,
      primary: article.inputSourcePrimary3 || false,
    });
  }
  
  // Source 4
  if (article.inputSourceText4) {
    sources.push({
      description: article.inputSourceDescription4 || "",
      accredit: article.inputSourceAccredit4 || "",
      sourceText: article.inputSourceText4,
      verbatim: article.inputSourceVerbatim4 || false,
      primary: article.inputSourcePrimary4 || false,
    });
  }
  
  // Source 5
  if (article.inputSourceText5) {
    sources.push({
      description: article.inputSourceDescription5 || "",
      accredit: article.inputSourceAccredit5 || "",
      sourceText: article.inputSourceText5,
      verbatim: article.inputSourceVerbatim5 || false,
      primary: article.inputSourcePrimary5 || false,
    });
  }
  
  // Source 6
  if (article.inputSourceText6) {
    sources.push({
      description: article.inputSourceDescription6 || "",
      accredit: article.inputSourceAccredit6 || "",
      sourceText: article.inputSourceText6,
      verbatim: article.inputSourceVerbatim6 || false,
      primary: article.inputSourcePrimary6 || false,
    });
  }

  return {
    metadata: {
      userId: article.createdBy || "",
      orgId: article.orgId.toString(),
      currentVersion: article.version,
    },
    slug: article.slug,
    headline: article.headline || "",
    sources: sources,
    instructions: {
      instructions: article.inputPresetInstructions,
      blobs: article.inputPresetBlobs,
      length: article.inputPresetLength,
    },
  };
}

/* ==========================================================================*/
// Pipeline Router
/* ==========================================================================*/

/**
 * executePipelineByArticleId
 * 
 * Execute the appropriate pipeline for an article based on its source type.
 * Fetches the article from the database and routes to digest or aggregate pipeline.
 * 
 * @param articleId - The article ID to process
 * @returns Pipeline execution result
 */
async function executePipelineByArticleId(articleId: string): Promise<PipelineExecutionResult> {
  console.log(`🎯 Starting pipeline execution for article: ${articleId}`);
  
  try {
    // Fetch article from database
    const article = await getArticleById(articleId);
    
    if (!article) {
      console.error(`❌ Article not found: ${articleId}`);
      return {
        success: false,
        error: "Article not found",
      };
    }
    
    console.log(`📄 Article found: ${article.slug} (sourceType: ${article.sourceType})`);

    await updateArticleStatus(articleId, article.createdBy || "", "started");

    
    // Route to appropriate pipeline based on source type
    if (article.sourceType === "single") {
      console.log("🔄 Routing to digest pipeline (single source)");
      
      // Build digest request from article data
      const digestRequest = buildDigestRequestFromArticle(article);
      
      // Execute digest pipeline
      const result = await runDigestPipeline(articleId, digestRequest);
      
      return {
        success: result.success,
        articleId: articleId,
      };
      
    } else if (article.sourceType === "multi") {
      console.log("🔄 Routing to aggregate pipeline (multi source)");
      
      // Build aggregate request from article data
      const aggregateRequest = buildAggregateRequestFromArticle(article);
      
      // Execute aggregate pipeline
      const result = await runAggregatePipeline(aggregateRequest);
      
      return {
        success: result.success,
        articleId: articleId,
      };
      
    } else {
      console.error(`❌ Unknown source type: ${article.sourceType}`);
      return {
        success: false,
        error: `Unknown source type: ${article.sourceType}`,
      };
    }
    
  } catch (error) {
    console.error(`💥 Pipeline execution failed for article ${articleId}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/* ==========================================================================*/
// Public API Exports
/* ==========================================================================*/

export { executePipelineByArticleId };
