/* ==========================================================================*/
// route.ts — Step 07: Sentence Per Line Attribution API Route
/* ==========================================================================*/
// Purpose: Split the final article into one sentence per line, preserving inline quotes
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
import { Step07SentencePerLineAttributionRequest, Step07SentencePerLineAttributionAIResponse } from '@/types/digest'

/* ==========================================================================*/
// Configuration
/* ==========================================================================*/

const model = openai('gpt-4o-mini')

/* ==========================================================================*/
// Schema
/* ==========================================================================*/

const FormattedArticleSchema = z.object({
  formattedArticle: z.string().describe('The article formatted with each sentence on a new line, preserving inline quotes and credits'),
  sentences: z.array(z.string()).describe('Array of individual sentences, preserving inline quotes as single items. Each sentence should end with proper punctuation.')
})

/* ==========================================================================*/
// Prompts
/* ==========================================================================*/

const SYSTEM_PROMPT = `
Split the article into individual sentences, with each sentence as a separate array item. Preserve inline quotes and credits as single items (don't split quoted dialogue). Remove any source tags.

###
Example output format:
Sentence.

Output: 
[
  "Sentence one.",
  "Sentence two.", 
  "Quote dialogue, \"like this. Even if it has multiple sentences inside.\"",
  "Final sentence."
]

FORMAT:
Return a JSON object with:
- formattedArticle: The article formatted with each sentence on a new line, preserving inline quotes and credits
- sentences: An array where each item is one sentence (keeping quoted dialogue together as single items). This is word for word identical to the formattedArticle, just in a different format.

<example>
`

const USER_PROMPT = `
<article>
{draft_text}
</article>
`

/* ==========================================================================*/
// Route Handler
/* ==========================================================================*/

export async function POST(request: NextRequest) {
  try {
    const body: Step07SentencePerLineAttributionRequest = await request.json()

    // Validate required fields
    if (!body.paraphrasedArticle) {
      return NextResponse.json(
        {
          formattedArticle: ''
        },
        { status: 400 }
      )
    }

    // Build prompts using the helper function
    const [systemPrompt, userPrompt] = buildPrompts(
      SYSTEM_PROMPT,
      USER_PROMPT,
      undefined, // No system variables needed
      {
        draft_text: body.paraphrasedArticle
      }
    )

    // Generate structured object using AI SDK
    const { object } = await generateObject({
      model,
      system: systemPrompt,
      prompt: userPrompt,
      schema: FormattedArticleSchema,
    })

    // Build response - only AI data
    const response: Step07SentencePerLineAttributionAIResponse = {
      formattedArticle: object.formattedArticle,
      sentences: object.sentences
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Step 07 - Sentence per line attribution failed:', error)
    
    const errorResponse: Step07SentencePerLineAttributionAIResponse = {
      sentences: [],
      formattedArticle: ''
    }

    return NextResponse.json(errorResponse, { status: 500 })
  }
}
