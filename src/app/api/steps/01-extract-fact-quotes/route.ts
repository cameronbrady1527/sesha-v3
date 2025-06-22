/* ==========================================================================*/
// route.ts — Step 01: Extract Fact Quotes API Route
/* ==========================================================================*/
// Purpose: Extract top twenty direct quotes from provided source text
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
import { Step01ExtractFactQuotesRequest, Step01ExtractFactQuotesAIResponse } from '@/types/digest'

/* ==========================================================================*/
// Configuration
/* ==========================================================================*/

const model = openai('gpt-4o-mini')

/* ==========================================================================*/
// Schema
/* ==========================================================================*/

const QuoteSchema = z.object({
  quote: z.string().describe('The direct quote from the source text'),
  context: z.string().describe('Context and attribution for the quote, including who said it and when/where')
})

/* ==========================================================================*/
// Prompts
/* ==========================================================================*/

const SYSTEM_PROMPT = `
List the top twenty direct quotes from the provided source text. Include some context and attribution. Ignore extraneous text or quotes not related to the story that may have been caught in the web scrape. If the source text is a study or a hearing, you can quote directly from the text.

Format:
Each quote should have:
- quote: The exact direct quote text
- context: Attribution and context (who said it, when, where)

Examples:
{
  "quote": "Jeffrey said, 'Great, we'll call up Trump and we'll go to'—I don't recall the name of the casino, but—'we'll go to the casino,'",
  "context": "Johanna Sjoberg's testimony/deposition in a civil lawsuit against Ghislaine Maxwell."
}

{
  "quote": "While there was no significant change in price last year, the results indicate an increase in of over 400% over the last quarter",
  "context": "text from the study describing the price increase in Oranges."
}

{
  "quote": "The current levels of population change across Europe are already the most dramatic since the collapse of the Roman Empire in the West. Doubling or tripling them is surely unsustainable. In the end, voters simply won't support it, and if current politicians won't support it, as they should, then they will vote for ones who will.",
  "context": "Lord Frost in the op-ed."
}

{
  "quote": "I would absolutely consider that",
  "context": "Nume's response when asked about the potential of returning to the ring."
}

{
  "quote": "It does look like a terrorist attack. The type of thing we've seen ISIS do in the past. And as far as we're aware, that's … our going assumption at the moment.",
  "context": "A senior U.S. official on Wednesday's bombing in Iran."
}
`

const USER_PROMPT = `Source: {source.accredit}

{instructions.description}
--
{source.text}`

/* ==========================================================================*/
// Route Handler
/* ==========================================================================*/

export async function POST(request: NextRequest) {
  try {
    const body: Step01ExtractFactQuotesRequest = await request.json()

    // Validate required fields
    if (!body.sourceText) {
      return NextResponse.json(
        {
          quotes: []
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
        source: {
          accredit: body.sourceAccredit,
          text: body.sourceText
        },
        instructions: {
          description: body.sourceDescription
        }
      }
    )

    // Log the formatted prompts if logger is available
    const logger = getGlobalLogger()
    if (logger) {
      logger.logStepPrompts(1, 'Extract Fact Quotes', systemPrompt, userPrompt)
    }

    // Generate structured object using AI SDK
    const { object: quotes } = await generateObject({
      model,
      system: systemPrompt,
      prompt: userPrompt,
      output: 'array',
      schema: QuoteSchema,
    })

    // Build response - only AI data
    const response: Step01ExtractFactQuotesAIResponse = {
      quotes
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Step 01 - Extract fact quotes failed:', error)
    
    const errorResponse: Step01ExtractFactQuotesAIResponse = {
      quotes: []
    }

    return NextResponse.json(errorResponse, { status: 500 })
  }
}
