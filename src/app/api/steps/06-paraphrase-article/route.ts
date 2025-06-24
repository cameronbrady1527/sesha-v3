/* ==========================================================================*/
// route.ts — Step 06: Paraphrase Article API Route
/* ==========================================================================*/
// Purpose: Paraphrase the full draft article for flow, clarity, and non-plagiarism
// Sections: Imports, Configuration, Prompts, Route Handler, Exports

/* ==========================================================================*/
// Imports
/* ==========================================================================*/

// Next.js Core ---
import { NextRequest, NextResponse } from "next/server";

// AI SDK Core ---
import { generateText } from "ai";

// Local Utilities ---
import { buildPrompts } from "@/lib/utils";
import { getGlobalLogger } from "@/lib/pipeline-logger";

// Local Types ----
import { Step06ParaphraseArticleRequest, Step06ParaphraseArticleAIResponse } from "@/types/digest";
import { anthropic } from "@ai-sdk/anthropic";

/* ==========================================================================*/
// Configuration
/* ==========================================================================*/

// const model = openai("gpt-4o-mini");
// const model = anthropic("claude-4-sonnet-20250514");
const model = anthropic("claude-3-opus-20240229");


/* ==========================================================================*/
// Prompts
/* ==========================================================================*/

const SYSTEM_PROMPT = `
You are an expert senior news editor writing an article that is a digest of longer source content.  Reprint the provided article line by line, but with a few small edits:

- expertly paraphrase each line to avoid plagiarism (but keep source tags)
- make sure the article flow smoothly from each topic (add transition phrases or move content around if absolutely necessary)
- remove any blatant repetition

The purpose is to clean up the writing and ensure that everything is fully paraphrased and credited in the source tags.

###
Example with user input and assistant output:

Input example:
<article>
On Thursday, Nima Momeni, a technology executive was apprehended in San Fransisco for stabbing and killing Bob Lee, the founder of Cash App, according to the police. (Source 1 AP)
Police refused to discuss a motive but said Lee knew Momeni. (Source 1 AP)
On the fourth of April at approximately 2:30 a.m. Pacific Time, Lee was discovered in San Francisco on the street, bleeding and stumbling. (Source 1 AP)
A witness said, "He was bleeding like crazy all over the place." (Source 1 AP)
Later on, Lee passed away in the hospital from injuries sustained during the attack. (Source 1 AP)
He was 43 years old. (Source 1 AP)
Police arrested Nima Momeni in Emeryville, a Bay Area city in which Momeni's company has offices. (Source 1 AP)
Momeni, 38, is the founder of Expand IT. (Source 1 AP)
On Monday afternoon, William Scott, the Chief of Police held a press briefing and said they are still investigating, but were confident that the right suspect was in custody. (Source 1 AP)
"We are still investigating," Scott commented. (Source 1 AP)
"But we are confident that we have the right suspect in custody," he added. (Source 1 AP)
</article>

Output example:
<article>
Nima Momeni, a tech executive was arrested on Thursday for the stabbing murder of Cash App founder Bob Lee in San Francisco, police said, adding that the suspect knew the victim but declining to discuss a possible motive for the crime. (Source 1 AP)
Lee was found stumbling through the streets of San Francisco at around 2:30 a.m. Pacific Time on April 4. (Source 1 AP)
"He was bleeding like crazy all over the place," reported a witness. (Source 1 AP)
Lee, 43, later died of his wounds at a hospital. (Source 1 AP)
Momeni, the 38-year-old founder of software company Expand IT, was arrested on suspicion of murder in the Bay Area city of Emeryvile, where his company has offices, San Francisco. (Source 1 AP)
Police Chief William Scott held a Monday afternoon news conference. (Source 1 AP)
"We are still investigating," said Scott, "but we are confident that we have the right suspect in custody." (Source 1 AP)
</article>

FORMAT:
Return a JSON object with:
- paraphrasedArticle: The complete paraphrased article text as a string

`;

const USER_PROMPT = `
<instructions>
You are an expert senior news editor writing an article that is an aggregation of multiple sources.  Reprint the provided line by line, but with a few small edits:

- expertly paraphrase each line to avoid plagiarism (but keep source tags)
- make sure the article flow smoothly from each topic (add transition phrases or move content around if absolutely necessary)
- remove any blatant repetition

The purpose is to clean up the writing and ensure that everything is fully paraphrased and credited in the source tags. 

Here is the article to reprint line by line with the necessary edits & rephrasings:
<article>
    {{draft_text}}
</article>
</instructions>

Source Articles List (this is reference content that was used for the initial draft):

<source-content>
Source tag: (Source 1)
Source 1 {{source_accredit}}

{{source_description}}
--
{{source_text}}
</source-content>
`;

/* ==========================================================================*/
// Route Handler
/* ==========================================================================*/

export async function POST(request: NextRequest) {
  try {
    const body: Step06ParaphraseArticleRequest = await request.json();

    // Validate required fields
    if (!body.sourceText || !body.articleText) {
      return NextResponse.json(
        {
          paraphrasedArticle: "",
        },
        { status: 400 }
      );
    }

    // Build prompts using the helper function
    const [systemPrompt, userPrompt] = buildPrompts(SYSTEM_PROMPT, USER_PROMPT, undefined, {
      draft_text: body.articleText,
      source_accredit: body.sourceAccredit,
      source_description: body.sourceDescription,
      source_text: body.sourceText,
    });

    // Log the formatted prompts if logger is available
    const logger = getGlobalLogger();
    if (logger) {
      logger.logStepPrompts(6, "Paraphrase Article", systemPrompt, userPrompt);
    }

    // Generate structured object using AI SDK
    const { text: paraphrasedArticle } = await generateText({
      model,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: userPrompt,
        },
        {
          role: "assistant",
          content: "Here is the article with each line expertly rephrased, all direct quotes kept 100% verbatim, and any necessary transitions added: <article>",
        },
      ],
      temperature: 0.2,
    });

    // Build response - only AI data
    const response: Step06ParaphraseArticleAIResponse = {
      paraphrasedArticle: paraphrasedArticle,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Step 06 - Paraphrase article failed:", error);

    const errorResponse: Step06ParaphraseArticleAIResponse = {
      paraphrasedArticle: "",
    };

    return NextResponse.json(errorResponse, { status: 500 });
  }
}
