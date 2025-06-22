"use server"

/* ==========================================================================*/
// pipeline2.ts — Simplified Content Generation Pipeline
/* ==========================================================================*/
// Purpose: Handle digest request by creating article/inputs then running 7 LLM steps
// Sections: Imports, Configuration, Database Operations, LLM Steps, Pipeline Handler, Exports

/* ==========================================================================*/
// Imports
/* ==========================================================================*/

// Core Modules ---
import "server-only";

// Local Database ----
import { createArticleRecord, updateArticleWithResults } from "@/db/dal";

// Local Utils ----
import { cleanSlug } from "@/lib/utils";
import { createPipelineLogger, initializeGlobalLogger, closeGlobalLogger, getGlobalLogger } from "@/lib/pipeline-logger";

// Local Types ----
import type { 
  DigestRequest, 
  PipelineResponse,
  Step01ExtractFactQuotesResponse,
  Step01ExtractFactQuotesAIResponse,
  Step02SummarizeFactsResponse,
  Step02SummarizeFactsAIResponse,
  Step03WriteHeadlineAndBlobsResponse,
  Step03WriteHeadlineAndBlobsAIResponse,
  Step04WriteArticleOutlineResponse,
  Step04WriteArticleOutlineAIResponse,
  Step05WriteArticleResponse,
  Step05WriteArticleAIResponse,
  Step06ParaphraseArticleResponse,
  Step06ParaphraseArticleAIResponse,
  Step07SentencePerLineAttributionResponse,
  Step07SentencePerLineAttributionAIResponse,
  Step01ExtractFactQuotesRequest,
  Step02SummarizeFactsRequest,
  Step03WriteHeadlineAndBlobsRequest,
  Step04WriteArticleOutlineRequest,
  Step05WriteArticleRequest,
  Step06ParaphraseArticleRequest,
  Step07SentencePerLineAttributionRequest
} from "@/types/digest";

/* ==========================================================================*/
// Configuration
/* ==========================================================================*/

const baseUrl = process.env.NEXT_PUBLIC_URL

// Validate API URL
if (!baseUrl) {
  console.error('⚠️ Missing NEXT_PUBLIC_URL environment variable. Steps will not work correctly.');
}


/**
 * validatePipelineSuccess
 * 
 * Validate if the pipeline was truly successful based on all step results.
 * Checks that all steps completed and final content is meaningful.
 * 
 * @param step1Result - Extract fact quotes result
 * @param step2Result - Summarize facts result  
 * @param step3Result - Write headline and blobs result
 * @param step4Result - Write article outline result
 * @param step5Result - Write article result
 * @param step6Result - Paraphrase article result
 * @param step7Result - Sentence per line attribution result
 * @returns True if all steps successful and content is valid
 */
function validatePipelineSuccess(
  step1Result: Step01ExtractFactQuotesResponse,
  step2Result: Step02SummarizeFactsResponse,
  step3Result: Step03WriteHeadlineAndBlobsResponse,
  step4Result: Step04WriteArticleOutlineResponse,
  step5Result: Step05WriteArticleResponse,
  step6Result: Step06ParaphraseArticleResponse,
  step7Result: Step07SentencePerLineAttributionResponse
): boolean {
  // Check if all steps are successful (ensure they are all truthy)
  const allStepsSuccessful = [
    step1Result,
    step2Result,
    step3Result,
    step4Result,
    step5Result,
    step6Result,
    step7Result
  ].every(result => result && result.success === true);

  // Check if step7 has meaningful content (> 100 chars)
  const finalArticle = Boolean(step7Result.sentences) && step7Result.sentences.length > 0;

  // Check if step3 has both headline and blobs
  const finalHeadlineAndBlobs = Boolean(step3Result.headline) && 
                                   step3Result.headline.length > 0 && 
                                   Boolean(step3Result.blobs) && 
                                   step3Result.blobs.length > 0;

  return allStepsSuccessful && finalArticle && finalHeadlineAndBlobs;
}

/* ==========================================================================*/
// LLM Step Functions
/* ==========================================================================*/

/**
 * step01ExtractFactQuotes
 * 
 * Extract key fact quotes from the source text.
 * 
 * @param articleId - Article ID for tracking
 * @param request - Digest request with source data
 * @returns Response with extracted quotes
 */
async function step01ExtractFactQuotes(articleId: string, request: DigestRequest): Promise<Step01ExtractFactQuotesResponse> {
  console.log('🚀 Step 1: Extract Fact Quotes');
  
  const logger = getGlobalLogger();
  
  try {
    // Prepare the request for the API
    const step01Request: Step01ExtractFactQuotesRequest = {
      sourceAccredit: request.source.accredit,
      sourceDescription: request.source.description,
      sourceText: request.source.sourceText
    };

    // Log the step request
    if (logger) {
      logger.logStepRequest(1, 'Extract Fact Quotes', step01Request);
    }

    // Call the API endpoint
    const response = await fetch(`${baseUrl}/api/steps/01-extract-fact-quotes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(step01Request),
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    const aiResult: Step01ExtractFactQuotesAIResponse = await response.json();
    
    // Log the API response
    if (logger) {
      logger.logStepResponse(1, 'Extract Fact Quotes', aiResult);
    }
    
    // Wrap AI response with article management
    const result = {
      articleId,
      stepNumber: 1,
      success: true,
      quotes: aiResult.quotes
    };

    // Log step completion
    if (logger) {
      logger.logStepComplete(1, 'Extract Fact Quotes', result);
    }

    return result;

  } catch (error) {
    console.error('Step 1 - Extract fact quotes failed:', error);
    
    // Log the error
    if (logger) {
      logger.logError('STEP_1_ERROR', error);
    }
    
    return {
      articleId,
      stepNumber: 1,
      success: false,
      quotes: []
    };
  }
}

/**
 * step02SummarizeFacts
 * 
 * Summarize the key facts from the source material.
 * 
 * @param articleId - Article ID for tracking
 * @param request - Digest request with source data
 * @returns Response with summarized facts
 */
async function step02SummarizeFacts(articleId: string, request: DigestRequest): Promise<Step02SummarizeFactsResponse> {
  console.log('🚀 Step 2: Summarize Facts');
  
  try {
    // Prepare the request for the API
    const step02Request: Step02SummarizeFactsRequest = {
      sourceAccredit: request.source.accredit,
      sourceDescription: request.source.description,
      sourceText: request.source.sourceText,
      instructions: request.instructions.instructions
    };

    // Call the API endpoint
    const response = await fetch(`${baseUrl}/api/steps/02-summarize-facts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(step02Request),
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    const aiResult: Step02SummarizeFactsAIResponse = await response.json();
    
    // Wrap AI response with article management
    return {
      articleId,
      stepNumber: 2,
      success: true,
      summary: aiResult.summary
    };

  } catch (error) {
    console.error('Step 2 - Summarize facts failed:', error);
    
    return {
      articleId,
      stepNumber: 2,
      success: false,
      summary: ''
    };
  }
}

/**
 * step03WriteHeadlineAndBlobs
 * 
 * Generate headline and content blobs for the article.
 * 
 * @param articleId - Article ID for tracking
 * @param request - Digest request with instructions
 * @returns Response with headline and blobs
 */
async function step03WriteHeadlineAndBlobs(articleId: string, request: DigestRequest): Promise<Step03WriteHeadlineAndBlobsResponse> {
  console.log('🚀 Step 3: Write Headline and Blobs');
  
  const logger = getGlobalLogger();
  
  try {
    // Prepare the request for the API
    const step03Request: Step03WriteHeadlineAndBlobsRequest = {
      blobs: parseInt(request.instructions.blobs),
      headline: request.headline, // Use the provided headline as manual headline
      instructions: request.instructions.instructions,
      // Add source content for AI to work with
      sourceAccredit: request.source.accredit,
      sourceDescription: request.source.description,
      sourceText: request.source.sourceText
    };

    // Log the step request
    if (logger) {
      logger.logStepRequest(3, 'Write Headline and Blobs', step03Request);
    }

    // Call the API endpoint
    const response = await fetch(`${baseUrl}/api/steps/03-write-headline-and-blobs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(step03Request),
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    const aiResult: Step03WriteHeadlineAndBlobsAIResponse = await response.json();
    
    // Log the API response
    if (logger) {
      logger.logStepResponse(3, 'Write Headline and Blobs', aiResult);
    }
    
    // Wrap AI response with article management
    const result = {
      articleId,
      stepNumber: 3,
      success: true,
      headline: aiResult.headline,
      blobs: aiResult.blobs
    };

    // Log step completion
    if (logger) {
      logger.logStepComplete(3, 'Write Headline and Blobs', result);
    }

    return result;

  } catch (error) {
    console.error('Step 3 - Write headline and blobs failed:', error);
    
    // Log the error
    if (logger) {
      logger.logError('STEP_3_ERROR', error);
    }
    
    return {
      articleId,
      stepNumber: 3,
      success: false,
      headline: '',
      blobs: []
    };
  }
}

/**
 * step04WriteArticleOutline
 * 
 * Create the structural outline for the article.
 * 
 * @param articleId - Article ID for tracking
 * @param request - Digest request with source data
 * @param step1Result - Previous step results for context
 * @param step2Result - Previous step results for context
 * @param step3Result - Previous step results for context
 * @returns Response with article outline
 */
async function step04WriteArticleOutline(articleId: string, request: DigestRequest, step1Result: Step01ExtractFactQuotesResponse, step2Result: Step02SummarizeFactsResponse, step3Result: Step03WriteHeadlineAndBlobsResponse): Promise<Step04WriteArticleOutlineResponse> {
  console.log('🚀 Step 4: Write Article Outline');
  
  try {
    // Prepare the request for the API with accumulated context
    const step04Request: Step04WriteArticleOutlineRequest = {
      sourceAccredit: request.source.accredit,
      sourceDescription: request.source.description,
      sourceText: request.source.sourceText,
      instructions: request.instructions.instructions,
      // Accumulated context from previous steps
      summarizeFactsText: step2Result.summary,
      extractFactQuotesText: JSON.stringify(step1Result.quotes), // Convert quotes array to string
      headlineAndBlobsText: `Headline: ${step3Result.headline}\nBlobs: ${step3Result.blobs.join('\n')}`
    };

    // Call the API endpoint
    const response = await fetch(`${baseUrl}/api/steps/04-write-article-outline`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(step04Request),
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    const aiResult: Step04WriteArticleOutlineAIResponse = await response.json();
    
    // Wrap AI response with article management
    return {
      articleId,
      stepNumber: 4,
      success: true,
      outline: aiResult.outline
    };

  } catch (error) {
    console.error('Step 4 - Write article outline failed:', error);
    
    return {
      articleId,
      stepNumber: 4,
      success: false,
      outline: []
    };
  }
}

/**
 * step05WriteArticle
 * 
 * Generate the full article content based on outline and previous steps.
 * 
 * @param articleId - Article ID for tracking
 * @param request - Digest request with length requirements
 * @param step2Result - Summary from step 2
 * @param step3Result - Headlines and blobs from step 3
 * @param step4Result - Outline from step 4
 * @returns Response with full article content
 */
async function step05WriteArticle(articleId: string, request: DigestRequest, step2Result: Step02SummarizeFactsResponse, step3Result: Step03WriteHeadlineAndBlobsResponse, step4Result: Step04WriteArticleOutlineResponse): Promise<Step05WriteArticleResponse> {
  console.log('🚀 Step 5: Write Article');
  
  try {
    // Prepare the request for the API with accumulated context
    const step05Request: Step05WriteArticleRequest = {
      length: request.instructions.length,
      sourceAccredit: request.source.accredit,
      sourceDescription: request.source.description,
      sourceText: request.source.sourceText,
      instructions: request.instructions.instructions,
      // Accumulated context from previous steps
      headlineAndBlobsText: `Headline: ${step3Result.headline}\nBlobs: ${step3Result.blobs.join('\n')}`,
      summarizeFactsText: step2Result.summary,
      articleOutlineText: step4Result.outline.join('\n')
    };

    // Call the API endpoint
    const response = await fetch(`${baseUrl}/api/steps/05-write-article`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(step05Request),
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    const aiResult: Step05WriteArticleAIResponse = await response.json();
    
    // Wrap AI response with article management
    return {
      articleId,
      stepNumber: 5,
      success: true,
      article: aiResult.article
    };

  } catch (error) {
    console.error('Step 5 - Write article failed:', error);
    
    return {
      articleId,
      stepNumber: 5,
      success: false,
      article: ''
    };
  }
}

/**
 * step06ParaphraseArticle
 * 
 * Paraphrase the article for style and tone improvements.
 * 
 * @param articleId - Article ID for tracking
 * @param request - Digest request with source context
 * @param step5Result - Article from step 5
 * @returns Response with paraphrased article
 */
async function step06ParaphraseArticle(articleId: string, request: DigestRequest, step5Result: Step05WriteArticleResponse): Promise<Step06ParaphraseArticleResponse> {
  console.log('🚀 Step 6: Paraphrase Article');
  
  try {
    // Prepare the request for the API
    const step06Request: Step06ParaphraseArticleRequest = {
      sourceAccredit: request.source.accredit,
      sourceDescription: request.source.description,
      sourceText: request.source.sourceText,
      // Article from previous step
      articleText: step5Result.article
    };

    // Call the API endpoint
    const response = await fetch(`${baseUrl}/api/steps/06-paraphrase-article`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(step06Request),
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    const aiResult: Step06ParaphraseArticleAIResponse = await response.json();
    
    // Wrap AI response with article management
    return {
      articleId,
      stepNumber: 6,
      success: true,
      paraphrasedArticle: aiResult.paraphrasedArticle
    };

  } catch (error) {
    console.error('Step 6 - Paraphrase article failed:', error);
    
    return {
      articleId,
      stepNumber: 6,
      success: false,
      paraphrasedArticle: ''
    };
  }
}

/**
 * step07SentencePerLineAttribution
 * 
 * Add line-by-line attribution and source tracking.
 * 
 * @param articleId - Article ID for tracking
 * @param request - Digest request (unused but kept for consistency)
 * @param step6Result - Paraphrased article from step 6
 * @returns Response with formatted article
 */
async function step07SentencePerLineAttribution(articleId: string, request: DigestRequest, step6Result: Step06ParaphraseArticleResponse): Promise<Step07SentencePerLineAttributionResponse> {
  console.log('🚀 Step 7: Sentence Per Line Attribution');
  
  try {
    // Prepare the request for the API
    const step07Request: Step07SentencePerLineAttributionRequest = {
      paraphrasedArticle: step6Result.paraphrasedArticle
    };

    // Call the API endpoint
    const response = await fetch(`${baseUrl}/api/steps/07-sentence-per-line-attribution`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(step07Request),
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    const aiResult: Step07SentencePerLineAttributionAIResponse = await response.json();
    
    // Wrap AI response with article management
    return {
      articleId,
      stepNumber: 7,
      success: true,
      sentences: aiResult.sentences,
      formattedArticle: aiResult.formattedArticle
    };

  } catch (error) {
    console.error('Step 7 - Sentence per line attribution failed:', error);
    
    return {
      articleId,
      stepNumber: 7,
      success: false,
      sentences: [],
      formattedArticle: ''
    };
  }
}

/* ==========================================================================*/
// Main Pipeline Handler
/* ==========================================================================*/

/**
 * executeDigestPipeline
 * 
 * Execute the complete digest pipeline.
 * Creates article record, runs 7 LLM steps sequentially, and updates final results.
 * 
 * @param request - Complete digest request with metadata, content, and instructions
 * @returns Pipeline response with success status and all step results
 * 
 * @example
 * const response = await executeDigestPipeline({
 *   metadata: { userId: '123', orgId: '1', currentVersion: null },
 *   slug: 'my-article',
 *   headline: 'Breaking News',
 *   source: { ... },
 *   instructions: { ... }
 * });
 */
async function executeDigestPipeline(request: DigestRequest): Promise<PipelineResponse> {
  console.log('🌟 Starting Digest Pipeline');
  console.log('📥 Request:', JSON.stringify(request, null, 2));

  // Initialize pipeline logger
  const logger = createPipelineLogger(`${request.metadata.userId}-${request.slug}`)
  
  // Also set as global logger for route handlers to use
  initializeGlobalLogger(`${request.metadata.userId}-${request.slug}`)

  try {
    // 1. Log initial request
    logger.logInitialRequest(request)

    // 2. Clean the slug before processing
    const originalSlug = request.slug
    const cleanedSlug = cleanSlug(request.slug);
    
    // Log slug cleaning process
    logger.logSlugCleaning(originalSlug, cleanedSlug)
    
    // Create the request with cleaned slug
    const cleanedRequest = {
      ...request,
      slug: cleanedSlug
    };

    // 3. Create article record
    const article = await createArticleRecord(cleanedRequest);

    // 4. Run all 7 steps with proper context passing and logging
    const step1Result = await step01ExtractFactQuotes(article.id, cleanedRequest);
    const step2Result = await step02SummarizeFacts(article.id, cleanedRequest);
    const step3Result = await step03WriteHeadlineAndBlobs(article.id, cleanedRequest);
    const step4Result = await step04WriteArticleOutline(article.id, cleanedRequest, step1Result, step2Result, step3Result);
    const step5Result = await step05WriteArticle(article.id, cleanedRequest, step2Result, step3Result, step4Result);
    const step6Result = await step06ParaphraseArticle(article.id, cleanedRequest, step5Result);
    const step7Result = await step07SentencePerLineAttribution(article.id, cleanedRequest, step6Result);

    // 5. Validate pipeline success
    const isSuccessful = validatePipelineSuccess(
      step1Result,
      step2Result,
      step3Result,
      step4Result,
      step5Result,
      step6Result,
      step7Result
    );

    // 6. Update article with results
    await updateArticleWithResults(
      article.id,
      request.metadata.userId,
      isSuccessful,
      step3Result.headline,
      step3Result.blobs,
      step7Result.formattedArticle,
      step7Result.sentences
    );

    // 7. Build and return response
    const response: PipelineResponse = {
      success: isSuccessful,
      step_one_extract_fact_quotes: step1Result,
      step_two_summarize_facts: step2Result,
      step_three_write_headline_and_blobs: step3Result,
      step_four_write_article_outline: step4Result,
      step_five_write_article: step5Result,
      step_six_paraphrase_article: step6Result,
      step_seven_sentence_per_line_attribution: step7Result,
    };

    // 8. Log pipeline completion
    logger.logPipelineComplete(isSuccessful, response)

    // 9. Close logger and save logs
    console.log(`📁 Pipeline logs saved to: ${logger.getLogFilePath()}`)
    await closeGlobalLogger()

    console.log('🎉 Pipeline completed successfully');
    return response;

  } catch (error) {
    console.error('💥 Pipeline failed:', error);
    
    // Log the error
    logger.logError('PIPELINE_ERROR', error)
    
    // Close logger even on failure
    try {
      console.log(`📁 Pipeline error logs saved to: ${logger.getLogFilePath()}`)
      await closeGlobalLogger()
    } catch (saveError) {
      console.error('Failed to close logger:', saveError)
    }
    
    return {
      success: false,
      // TODO: Add error details to response type if needed
    };
  }
}

/* ==========================================================================*/
// Public API Exports
/* ==========================================================================*/

export { executeDigestPipeline };
