/* ==========================================================================*/
// route.ts — Step 02: Summarize Facts API Route
/* ==========================================================================*/
// Purpose: Create detailed and comprehensive 200-word summary of key facts
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
import { Step02SummarizeFactsRequest, Step02SummarizeFactsAIResponse } from '@/types/digest'

/* ==========================================================================*/
// Configuration
/* ==========================================================================*/

const model = openai('gpt-4o-mini')

/* ==========================================================================*/
// Schema
/* ==========================================================================*/

const SummarySchema = z.object({
  summary: z.string().describe('A detailed and comprehensive 200-word summary of the key facts, events, and content')
})

/* ==========================================================================*/
// Prompts
/* ==========================================================================*/

const SYSTEM_PROMPT = `
<role> You are an expert senior news editor in the process of writing an article that is a digest of a much longer text.</role>
<instructions>
Write a detailed and comprehensive 200-word summary of the key facts, events, and content in the provided source material.

Here are some editor notes that may be useful in writing the summary:
{instructions}

Make sure that you report the facts as they are, don't add analysis. The digest is of longer source content which may be an opinion piece, a legal brief, a scientific paper, etc. If the piece is opinion or writing from someone, this digest article will be about their writing (for example "Claudine Gay pushes back against her Harvard ousting in new op-ed in the New York Times." or another example "Trump's latest Tweet could land him in prison, legal expert claims").

The summary should include a reference to what the source material is and what format it is. (For example, "In a supreme court ruling, justices X Y Z write..." or "In an interview with Nume on DMG News, Michael Gunn stated..." etc).

Explain in detail who each person is, the timeline of events (key dates, etc), and the key conflict/events of the source content. Also include any relevant or important facts and figures and hard numbers/data.
</instructions>

FORMAT:
Return a JSON object with:
- summary: The 200-word summary of the content (what was the press release, what did the study find, what was the court decision, what is the content, etc.)

Note: Make sure that the details and facts are understandable to the average reader. Write the summary in past tense.
`

const USER_PROMPT = `
Source content:
<source-1-content>
Source: {source.accredit}
Description: {source.description}
--
{source.text}
</source-1-content>
`

/* ==========================================================================*/
// Route Handler
/* ==========================================================================*/

export async function POST(request: NextRequest) {
  try {
    const body: Step02SummarizeFactsRequest = await request.json()

    // Validate required fields
    if (!body.sourceText) {
      return NextResponse.json(
        {
          summary: ''
        },
        { status: 400 }
      )
    }

    // Build prompts using the helper function
    const [systemPrompt, userPrompt] = buildPrompts(
      SYSTEM_PROMPT,
      USER_PROMPT,
      {
        instructions: body.instructions || ''
      },
      {
        source: {
          accredit: body.sourceAccredit,
          description: body.sourceDescription,
          text: body.sourceText
        }
      }
    )

    // Generate structured object using AI SDK
    const { object } = await generateObject({
      model,
      system: systemPrompt,
      prompt: userPrompt,
      schema: SummarySchema,
    })

    // Build response - only AI data
    const response: Step02SummarizeFactsAIResponse = {
      summary: object.summary
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Step 02 - Summarize facts failed:', error)
    
    const errorResponse: Step02SummarizeFactsAIResponse = {
      summary: ''
    }

    return NextResponse.json(errorResponse, { status: 500 })
  }
}
