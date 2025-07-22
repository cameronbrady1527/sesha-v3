/* ==========================================================================*/
// route.ts — Step 07: Rewrite Article 2 API Route
/* ==========================================================================*/
// Purpose: Add in-sentence source attribution once per source article
// Sections: Imports, Configuration, Prompts, Route Handler, Exports

/* ==========================================================================*/
// Imports
/* ==========================================================================*/

// Next.js Core ---
import { NextRequest, NextResponse } from "next/server";

// AI SDK Core ---
import { generateText } from "ai";

// Local Utilities ---
import { formatPrompt2, PromptType, validateRequest } from "@/lib/utils";
import { createPipelineLogger } from "@/lib/pipeline-logger";

// Local Types ----
import { Step07RewriteArticle2Request, Step07RewriteArticle2AIResponse } from "@/types/aggregate";
import { anthropic } from "@ai-sdk/anthropic";

/* ==========================================================================*/
// Configuration
/* ==========================================================================*/

const MODEL = anthropic("claude-3-5-sonnet-20240620");
const TEMPERATURE = 0.2;
const MAX_TOKENS = 3700;

// ==========================================================================
// System Prompts
// ==========================================================================

const SYSTEM_PROMPT = `
INSTRUCTIONS: Rewrite the article word for word, but with one small edit: Add in-sentence source attribution once per source article used. Add the attribution the first time the source article is referenced. Leave the source article tags as is, since they are separate from IN-SENTENCE attribution.

NOTES:
- The first paragraph should NOT have attribution to a source article(s)
- Only add source article attribution after the article once per source article
- The only edits should be the source article attribution
- Make sure the correct names of the source articles are used with proper capitalization
- Don't add extra attribution to quotes or lines with source article attribution in them already
- Only credit one source article at a time
- Source article attribution should only appear at the end of sentences.
- Source article attribution could include "...reported X." or "...according to X." or "...X reported."
- Leave the source article tags in parentheses at the end of every sentence, for example: (Source 1 NewsCo)
- Don't add new credits for anything from editor notes
- Dont add new credits for anything that is marked with a source number but no credit, for example, (Source 1) should not be credited since it doesn't have a credit like "CNN" inside the tag
- Make sure to keep all existing instances of in-sentence attribution
{{#initialSources.0.useVerbatim}}This opening text should remain unaltered, since it was already manually written by the editor: 
{{stepOutputs.factsBitSplitting.0.text}}{{/initialSources.0.useVerbatim}}

NOTE: If there are multiple sources in the tags, use the first source listed in the tag. For example, if provided "Blah blah blah (Source 1 CNN, Source 3 NumeNews)" you would add credit as "Blah blah blah, according to CNN. (Source 1 CNN, Source 3 NumeNews)" since that is the first source listed in the source tag. But remember, if the source doesn't have a credit and only has a number it should not be credited.

Remember, you are only adding ONE attribution per source article used. 

###

EXAMPLE INPUT
<example>
<aggregation>
Govind Nume is an American Beatboxer (Source 4). Govind Nume announced his retirement from beatboxing on Friday (Source 1 People, Source 2 MSN). 

The announcement comes after a long career of beatboxing in the United States, and multiple titles (Source 2 MSN). Nume was born in Michigan, and first competed in the Midwest Beatbox Battle in 2014, a short drive down from Detroit to Columbus Ohio (Source 3 NumeNews, Source 4).  

"It was hectic, but fun," Nume said in a news conference. (Source 1 People)

Nume later shared his hopes for the beatbox scene, hoping for more gender diversity. (Source 1 People) Nume is 28, and lives in Brooklyn. (Source 4 no credit) 

He's lived in Brooklyn for 5 years. (Source 4) He lives there with his partner. (Source 2 MSN)
...
Nume's contributions to the scene include dozens of articles on how to beatbox and years of mentoring and performances. (Source 6 HumanBeatbox.com)
</aggregation>

EXAMPLE REWRITE:
<rewrite>
Govind Nume is an American Beatboxer (Source 4). Govind Nume announced his retirement from beatboxing on Friday. (Source 1 People, Source 2 MSN) 

The announcement comes after a long career of beatboxing in the United States, and multiple titles, MSN reported. (Source 2 MSN) Nume was born in Michigan, and first competed in the Midwest Beatbox Battle in 2014, a short drive down from Detroit to Columbus Ohio, according to NumeNews. (Source 3 NumeNews, Source 4)  

"It was hectic, but fun," Nume said in a news conference. (Source 1 People) 

Nume later shared his hopes for the beatbox scene, hoping for more gender diversity, People reported. (Source 1 People)  Nume is 28, and lives in Brooklyn. (Source 4 no credit) He's lived in Brooklyn for 5 years. (Source 4) He lives there with his partner. (Source 2 MSN) 
...
Nume's contributions to the scene include dozens of articles on how to beatbox and years of mentoring and performances, HumanBeatbox.com reported. (Source 6 HumanBeatbox.com)
</rewrite>

Note that you added in-sentence attribution ONCE per source used. You don't add in-sentence attribution to the lede (the first paragraph). You keep the source tags after each sentence.
`;

// ==========================================================================
// User Prompt
// ==========================================================================

const USER_PROMPT = `
NOTE: Do not add any attribution or credits if the source tag just has a number (eg "Source 7" should not be credited anywhere, but "Source 7 NewsCo" would be credited as "NewsCo")

IMPORTANT: Only add credits for these source articles:
{{#initialSources.0.accredit}}{{initialSources.0.accredit}}{{/initialSources.0.accredit}}
{{#initialSources.1.accredit}}{{initialSources.1.accredit}}{{/initialSources.1.accredit}}
{{#initialSources.2.accredit}}{{initialSources.2.accredit}}{{/initialSources.2.accredit}}
{{#initialSources.3.accredit}}{{initialSources.3.accredit}}{{/initialSources.3.accredit}}
{{#initialSources.4.accredit}}{{initialSources.4.accredit}}{{/initialSources.4.accredit}}
{{#initialSources.5.accredit}}{{initialSources.5.accredit}}{{/initialSources.5.accredit}}

IMPORTANT: ONLY add attribution once per source article, and only one at a time
<article>
{{stepOutputs.rewriteArticle.text}}
</article>
`;

// ==========================================================================
// Assistant Prompt
// ==========================================================================

const ASSISTANT_PROMPT = `
<rewrite>{{#initialSources.0.useVerbatim}}{{stepOutputs.factsBitSplitting.0.text}}{{/initialSources.0.useVerbatim}}
`;

/* ==========================================================================*/
// Route Handler
/* ==========================================================================*/

export async function POST(request: NextRequest) {
  try {
    const body: Step07RewriteArticle2Request = await request.json();

    // Validate required fields ------
    const validationError = validateRequest(
      Boolean(body.articleStepOutputs?.rewriteArticle?.text), 
      {
        rewrittenArticle: "",
      } as Step07RewriteArticle2AIResponse
    );
    if (validationError) return validationError;

    // Format System Prompt ------
    const finalSystemPrompt = formatPrompt2(
      SYSTEM_PROMPT,
      { 
        initialSources: body.sources,
        stepOutputs: body.articleStepOutputs
      },
      PromptType.SYSTEM
    );

    // Format User Prompt ------
    const finalUserPrompt = formatPrompt2(
      USER_PROMPT,
      { 
        initialSources: body.sources,
        stepOutputs: body.articleStepOutputs
      },
      PromptType.USER
    );

    // Format Assistant Prompt ------
    const finalAssistantPrompt = formatPrompt2(
      ASSISTANT_PROMPT,
      { 
        initialSources: body.sources,
        stepOutputs: body.articleStepOutputs
      },
      PromptType.ASSISTANT
    );

    // Create a route-specific logger for this step
    const logger = createPipelineLogger(`route-step07-${Date.now()}`);
    logger.logStepPrompts(7, "Rewrite Article 2", finalSystemPrompt, finalUserPrompt, finalAssistantPrompt);

    // Generate text using messages approach
    const { text: rewrittenArticle } = await generateText({
      model: MODEL,
      system: finalSystemPrompt,
      messages: [
        {
          role: "user",
          content: finalUserPrompt,
        },
        {
          role: "assistant",
          content: finalAssistantPrompt || "",
        },
      ],
      temperature: TEMPERATURE,
      maxTokens: MAX_TOKENS,
    });

    // Build response
    const response: Step07RewriteArticle2AIResponse = {
      rewrittenArticle,
    };

    logger.logStepResponse(7, "Rewrite Article 2", response);

    // Close the logger to ensure logs are flushed
    await logger.close();

    return NextResponse.json(response);
  } catch (error) {
    console.error("Step 07 - Rewrite article 2 failed:", error);

    const errorResponse: Step07RewriteArticle2AIResponse = {
      rewrittenArticle: "",
    };

    return NextResponse.json(errorResponse, { status: 500 });
  }
}
