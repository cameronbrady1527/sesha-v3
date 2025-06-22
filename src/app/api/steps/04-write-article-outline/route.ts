/* ==========================================================================*/
// route.ts — Step 04: Write Article Outline API Route
/* ==========================================================================*/
// Purpose: Create structural outline for the article with 10+ key points
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
import { Step04WriteArticleOutlineRequest, Step04WriteArticleOutlineAIResponse } from '@/types/digest'

/* ==========================================================================*/
// Configuration
/* ==========================================================================*/

const model = openai('gpt-4o-mini')

/* ==========================================================================*/
// Schema
/* ==========================================================================*/

const OutlineSchema = z.object({
  outline: z.array(z.string()).describe('Array of key points for the article outline, each should be a complete sentence describing a key point of the story')
})

/* ==========================================================================*/
// Prompts
/* ==========================================================================*/

const SYSTEM_PROMPT = `
<instructions>
We are in the process of writing an article that is a digest/report on a much longer text. The digest is of longer source content which may be an opinion piece, a legal brief, a scientific paper, etc. If the piece is opinion or writing from someone, this digest article will be about their writing and credit the ideas to them (for example "Claudine Gay pushes back against her Harvard ousting in new op-ed in the New York Times."  Use the source content, the headline and blobs, and the editor instructions and other notes to craft the article outline based on the sources.

####

Here is the format:

FORMAT:
Return a JSON object with:
- outline: An array of key points in order, each as a string

Each key point should be:
1: (insert key point (this should be similar to the headline and usually based on source 1. It should also name or credit who wrote/authored Source 1. this needs to be punchy and newsy)) 
2: (insert next key point about the main story based on the source content) (insert source tag)
3: (insert next key point about the main story based on the source content) (insert source tag)
4: (insert next key point about the main story based on the source content) (insert source tag)
5: (insert next key point about the main story based on the source content) (insert source tag)
6: (insert next key point about the main story based on the source content) (insert source tag)
7: (insert next key point about the main story based on the source content) (insert source tag)
8: (insert next key point about the main story based on the source content) (insert source tag)
9: (insert next key point about the main story based on the source content) (insert source tag)
10: (insert next key point about the main story based on the source content) (insert source tag)
...
N: (insert next key point about the main story based on the source content) (insert source tag)
NOTE: Do not write a conclusion/summary

RULES:
- KEY POINT 1 must be the same angle as the headline
- KEY POINT 1 is NOT a summary, it's just the most relevant and important first fact of the article as determined by the headline
- You must paraphrase the source content to avoid plagiarism
- You must write at least 10 key points
- After all of the key points, you must write "NOTE: Do not write a conclusion/summary"

Use this summary to determine the angle of how to report on the source content:
{stepOutputs.summarize_facts.text}

Quotes to use as additional reference:
{stepOutputs.extract_fact_quotes.text}
`

const USER_PROMPT = `
We are in the process of writing an article that is a digest/report on a much longer text. The digest is a news article that reports on longer source content which may be an opinion piece, a legal brief, a scientific paper, etc.

Credit the ideas and conclusions in the source article to the author or authoring body (for example "In an oped in the Independent, Nume argues XYZ") If it's a court decision or scientific paper, the news story should detail what the authors or council etc said or discovered in the source content. 

Use the source article and description, the headline and blobs, and the editor instructions and other source material to craft the article outline based on the source content. You must write at least 10 key points.

FORMAT:
Return a JSON object with an outline array where each key point follows this structure:
1: (insert key point (this should be similar to the headline and usually based on source 1. It should also name or credit who wrote/authored Source 1. this needs to be punchy and newsy)) (insert source tag)
2: (insert next key point about the main story) (insert source tag)
3: (insert next key point about the main story) (insert source tag)
4: (insert next key point about the main story) (insert source tag)
5: (insert next key point about the main story) (insert source tag)
6: (insert next key point about the main story) (insert source tag)
7: (insert next key point about the main story) (insert source tag)
8: (insert key point adding another angle or context) (insert source tag)
9: (insert next key point) (insert source tag)
10: (insert key point) (insert source tag)
...
N: (insert key point) (insert source tag)
NOTE: Do not write a conclusion/summary

Make sure to start with the core news story and flashiest detail (a STRONG PUNCHY lede). Then transition/work your way through the whole story. This outline should just be short bullet points that mention what details or quotes to use where and how to develop the story.

###

Headline & Blobs (to help guide article):
{outputs.write_headline_and_blobs.text}

Editor Notes (IMPORTANT): 
{instructions}

Make sure to include the author or context of the source in key point one (was it an opinion piece by x author? was it a study published by x group? etc)

Make sure the article will be easy to understand, even if the source text is complex (like a study or press release).
Make sure that the outline and article is extremely long and comprehensive, and that complex concepts or phrases are explained (using the source content)

###

Here are source articles that should be used for reference:

Source 1: {source.accredit}
Description: {source.description}
--
{source.text}

###
Summary and facts to use as reference:
<summary>
{outputs.summarize_facts.text}

Quotes to use as additional reference:
{outputs.extract_fact_quotes.text}
`

/* ==========================================================================*/
// Route Handler
/* ==========================================================================*/

export async function POST(request: NextRequest) {
  try {
    const body: Step04WriteArticleOutlineRequest = await request.json()

    // Validate required fields
    if (!body.sourceText) {
      return NextResponse.json(
        {
          outline: []
        },
        { status: 400 }
      )
    }

    // Build prompts using the helper function
    const [systemPrompt, userPrompt] = buildPrompts(
      SYSTEM_PROMPT,
      USER_PROMPT,
      {
        'stepOutputs.summarize_facts.text': body.summarizeFactsText,
        'stepOutputs.extract_fact_quotes.text': body.extractFactQuotesText
      },
      {
        'outputs.write_headline_and_blobs.text': body.headlineAndBlobsText,
        instructions: body.instructions,
        source: {
          accredit: body.sourceAccredit,
          description: body.sourceDescription,
          text: body.sourceText
        },
        'outputs.summarize_facts.text': body.summarizeFactsText,
        'outputs.extract_fact_quotes.text': body.extractFactQuotesText
      }
    )

    // Generate structured object using AI SDK
    const { object } = await generateObject({
      model,
      system: systemPrompt,
      prompt: userPrompt,
      schema: OutlineSchema,
    })

    // Build response - only AI data
    const response: Step04WriteArticleOutlineAIResponse = {
      outline: object.outline
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Step 04 - Write article outline failed:', error)
    
    const errorResponse: Step04WriteArticleOutlineAIResponse = {
      outline: []
    }

    return NextResponse.json(errorResponse, { status: 500 })
  }
}
