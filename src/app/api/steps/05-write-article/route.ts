/* ==========================================================================*/
// route.ts — Step 05: Write Article API Route
/* ==========================================================================*/
// Purpose: Generate the full digest article from outline and source material
// Sections: Imports, Configuration, Prompts, Route Handler, Exports

/* ==========================================================================*/
// Imports
/* ==========================================================================*/

// Next.js Core ---
import { NextRequest, NextResponse } from 'next/server'

// AI SDK Core ---
import { generateObject } from 'ai'
import { openai } from '@ai-sdk/openai'
import { z } from 'zod'

// Local Utilities ---
import { buildPrompts } from '@/lib/utils'

// Local Types ----
import { Step05WriteArticleRequest, Step05WriteArticleAIResponse } from '@/types/digest'
import type { LengthRange } from '@/db/schema'

/* ==========================================================================*/
// Configuration
/* ==========================================================================*/

const model = openai('gpt-4o-mini')

// Word target mapping
const WORD_TARGET_MAP: Record<LengthRange, number> = {
  '100-250': 100,
  '400-550': 400,
  '700-850': 700,
  '1000-1200': 1000,
}

/* ==========================================================================*/
// Schema
/* ==========================================================================*/

const ArticleSchema = z.object({
  article: z.string().describe('The complete article text, expertly reported and thorough')
})

/* ==========================================================================*/
// Prompts
/* ==========================================================================*/

const SYSTEM_PROMPT = `
CONTEXT:
Write an article that is a digest or reporting on a much longer piece of text (source 1). Use the source text, the headline and blobs, and the editor instructions and other notes to write the article based fully on the provided source text.

The given text may be court documents, original reporting, a blog post, or some other longer piece of writing. We are expert journalists editing an article that is a digest of the original text as a news story, ONLY using facts quotes and details from the input source (Source 1).

SPECIFIC INSTRUCTIONS: Write an expertly reported, thorough article that is {word_target} words long. Use the facts and direct quotes from people quoted in the source article (Source 1) to write an extremely thorough, well-structured, detailed news article. Follow the editor instructions and suggestions.

Use each of the interesting direct quotes from people and facts from the source articles. Move logically through the article by introducing the most important and interesting events, details, and direct quotes (inside quotation marks), and then add more and more information and quotes from the source content about each element of the input content until the article is finished.

NOTES, CONTENT, & ARTICLE STRUCTURE:
- IMPORTANT: Use as many direct quotes as possible from people quoted in the source article
- Structure the article so that relevant information is grouped for clarity before moving to the next topic from the sources
- If there is conflict or unpleasant content in the quotes or fact list, use it
- Make sure that this digest article paraphrases the content from the source article to avoid plagiarism, and make sure any direct quotes are placed in quotation marks with appropriate credits
- Focus on quotes and the most dramatic events
- Everything needs to be thoroughly rooted in the facts & source text
- Use the editor notes when crafting the article
- Make sure the article is very detailed
- Let the facts and direct credited quotes tell the story, do not editorialize
- Use spartan writing that is extremely clear and concise
- You may ONLY reference facts, quotes (with credits), and details provided in Source 1. You may not add any other quotes, analysis, or context.

LENGTH:
The detailed article should be {word_target} words long with many quotes. Use the full {word_target} word length.

Editor notes (IMPORTANT):
{editor_notes}

TONE AND STYLE:
The tone is extremely straightforward and spartan. Do not use any adverbs or editorializing. Make sure the core facts and conflict are understandable by simplifying legal jargon and writing clearly and simply.
Do not add annoying phrases like "In a twist" or "Upsettingly," and instead just write the facts as they are.

IMPORTANT:
- Make sure to pull the most newsworthy and interesting information
- Capture and report the arguments of the source material as well as the content
- Make sure the article is impeccably written with zero frills. Just state the facts and include direct quotations inside quotation marks where needed.

FORMAT:
Return a JSON object with:
- article: The complete article text as a string
`

const USER_PROMPT = `
Write an article that is a digest or reporting on a much longer piece of text (source 1). Use the source text, the headline and blobs, and the editor instructions and other notes to write the article based fully on the provided source text.

IMPORTANT: You must write the article in a way that is easy for the general public to understand. Simplify complex concepts in everyday language. Add a source tag after each line like this: (Source 1)

Length: The article should be around {word_target} words and extremely thorough.

Headline & Blobs:
{headline_blobs}

Summary of source content:
{summary_text}

Outline (follow this exactly):
{outline_text}

SOURCE CONTENT (only reference this):
(Source 1) {source_accredit}
Description: {source_description}
--
{source_text}
`

/* ==========================================================================*/
// Route Handler
/* ==========================================================================*/

export async function POST(request: NextRequest) {
  try {
    const body: Step05WriteArticleRequest = await request.json()

    // Validate required fields
    if (!body.sourceText) {
      return NextResponse.json(
        {
          article: ''
        },
        { status: 400 }
      )
    }

    // Determine target word count from length setting
    const wordTarget = WORD_TARGET_MAP[body.length] || 600

    // Build prompts using the helper function
    const [systemPrompt, userPrompt] = buildPrompts(
      SYSTEM_PROMPT,
      USER_PROMPT,
      {
        word_target: wordTarget.toString(),
        editor_notes: body.instructions
      },
      {
        word_target: wordTarget.toString(),
        headline_blobs: body.headlineAndBlobsText,
        summary_text: body.summarizeFactsText,
        outline_text: body.articleOutlineText,
        source_accredit: body.sourceAccredit,
        source_description: body.sourceDescription,
        source_text: body.sourceText
      }
    )

    // Generate structured object using AI SDK
    const { object } = await generateObject({
      model,
      system: systemPrompt,
      prompt: userPrompt,
      schema: ArticleSchema,
    })

    // Build response - only AI data
    const response: Step05WriteArticleAIResponse = {
      article: object.article
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Step 05 - Write article failed:', error)
    
    const errorResponse: Step05WriteArticleAIResponse = {
      article: ''
    }

    return NextResponse.json(errorResponse, { status: 500 })
  }
}
