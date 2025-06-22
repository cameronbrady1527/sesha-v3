/* ==========================================================================*/
// route.ts — Step 03: Write Headline and Blobs API Route
/* ==========================================================================*/
// Purpose: Generate punchy headline and short blobs for the story
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
import { getGlobalLogger } from '@/lib/pipeline-logger'

// Local Types ----
import { Step03WriteHeadlineAndBlobsRequest, Step03WriteHeadlineAndBlobsAIResponse } from '@/types/digest'

/* ==========================================================================*/
// Configuration
/* ==========================================================================*/

const model = openai('gpt-4o-mini')

/* ==========================================================================*/
// Schema
/* ==========================================================================*/

const HeadlineAndBlobsSchema = z.object({
  headline: z.string().describe('A punchy, attention-grabbing headline that captures the most newsworthy development'),
  blobs: z.array(z.string()).describe('Array of short, punchy sentences covering core highlights of the story')
})

/* ==========================================================================*/
// Prompts
/* ==========================================================================*/

const SYSTEM_PROMPT = `
We are expert journalists in the process of writing an article that is a digest of a much longer text. Write a headline and set of additional sentences (called blobs) based on these instructions and the source content. 

INSTRUCTIONS FOR THE HEADLINE AND BLOBS: The headline and blobs should encompass the most interesting and most timely elements or developments in the article. The headline and blobs should be short, engaging and magnetic. Blobs can include direct quotes when mentioning striking/notable things people have said but must be short and punchy. The blobs should cover each element in the story so that we understand the core highlights across the various events of the article. The headline must capture the most important or newsworthy/recent development in the story. It should be clear, factual, and interesting. It should be specific and attention grabbing. Think tabloid, with the most juicy or dramatic and TIMELY SPECIFIC DETAILS detail in the headline. 

RESPONSE FORMAT: Return a JSON object with:
- headline: The main headline as a string
- blobs: An array of blob strings

The user will specify the number of blobs to write and may give editor instructions that say the content or focus of the blobs.

In general, the tone and structure of the headline and blobs should be something like this:
`

const USER_PROMPT = `
Number of Blobs: {num_blobs}
{manual_headline_block}

IMPORTANT EDITOR NOTES:  
{editor_notes}

Additional editor instructions:
Each blob MUST start with a different word
The blobs must be short, punchy, and written in a newsy style (not dry)
Make sure to include the author or context of the source article in the first blob. (Eg, "... in a piece by X author in Y publication")
Even if the input is hard science, a dry court ruling, or another dense text, the headline and blobs MUST be written in pithy, easy‑to‑understand english. For example, instead of "In a groundbreaking judgement addressing the multifaceted elements of electric vehicles, a Michigan court declared that..." just write "A Michigan court ruled X" 

Source: {source_accredit}
{source_description}
--
{source_text}
`

/* ==========================================================================*/
// Route Handler
/* ==========================================================================*/

export async function POST(request: NextRequest) {
  try {
    const body: Step03WriteHeadlineAndBlobsRequest = await request.json()

    // Validate required fields - allow empty strings but not undefined/null
    if (body.instructions === undefined || body.instructions === null) {
      return NextResponse.json(
        {
          headline: '',
          blobs: []
        },
        { status: 400 }
      )
    }

    // Resolve dynamic pieces for the user prompt
    const manualHeadlineBlock = body.headline 
      ? `Manual Headline (you must use this headline):\n${body.headline}` 
      : ''

    // Build prompts using the helper function
    const [systemPrompt, userPrompt] = buildPrompts(
      SYSTEM_PROMPT,
      USER_PROMPT,
      undefined, // No system variables needed
      {
        num_blobs: body.blobs.toString(),
        manual_headline_block: manualHeadlineBlock,
        editor_notes: body.instructions,
        source_accredit: body.sourceAccredit || '',
        source_description: body.sourceDescription || '',
        source_text: body.sourceText || ''
      }
    )

    // Log the formatted prompts if logger is available
    const logger = getGlobalLogger()
    if (logger) {
      logger.logStepPrompts(3, 'Write Headline and Blobs', systemPrompt, userPrompt)
    }

    // Generate structured object using AI SDK
    const { object } = await generateObject({
      model,
      system: systemPrompt,
      prompt: userPrompt,
      schema: HeadlineAndBlobsSchema,
    })

    // Build response - only AI data
    const response: Step03WriteHeadlineAndBlobsAIResponse = {
      headline: body.headline ? body.headline : object.headline,
      blobs: object.blobs
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Step 03 - Write headline and blobs failed:', error)
    
    const errorResponse: Step03WriteHeadlineAndBlobsAIResponse = {
      headline: '',
      blobs: []
    }

    return NextResponse.json(errorResponse, { status: 500 })
  }
}
