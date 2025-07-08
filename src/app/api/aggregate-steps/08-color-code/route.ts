/* ==========================================================================*/
// route.ts — Step 08: Color Code API Route
/* ==========================================================================*/
// Purpose: Color code article sentences based on source attribution
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
import { Step08ColorCodeRequest, Step08ColorCodeAIResponse } from "@/types/aggregate";
import { anthropic } from "@ai-sdk/anthropic";

/* ==========================================================================*/
// Configuration
/* ==========================================================================*/

const MODEL = anthropic("claude-3-5-sonnet-20240620");
const TEMPERATURE = 0.7;
const MAX_TOKENS = 3000;

// ==========================================================================
// System Prompts
// ==========================================================================

const SYSTEM_PROMPT = `
<instructions>
Take the given article and reprint it word for word, but color coded. Reprint it with each sentence on a new line (unless the sentence is INSIDE a direct quote). Each line in the input should be appropriately color coded based on the corresponding source article from the source list. The purpose is just to color code the existing article based on the source article tags with no other changes.

Wrap each sentence (or quote) with a color tag based on the source key. Replace the source article tags with the color coding as outlined below:
Source 1 = <p><span style="color: black;"></span></p>
Source 2 = <p><span style="color: darkblue;"></span></p>
Source 3 = <p><span style="color: darkred;"></span></p>
Source 4 = <p><span style="color: green;"></span></p>
Source 5 = <p><span style="color: purple;"></span></p>
Source 6 = <p><span style="color: orange;"></span></p>

NOTE: If a line has credit IN THE TEXT (eg "according to NumeNews") that is probably the source that should determine color coding.
Or, if a line has multiple source tags, just use the FIRST source in the tag to determine the color coding. Do not edit the in-sentence attribution

###
OUTPUT FORMAT:
<p><span style="color: (insert color);">Insert sentence.</span></p>
<p><span style="color: (insert color);">Insert sentence "with quote"</span></p>
<p><span style="color: (insert color);">Insert sentence.</span></p>
</instructions>

EXAMPLE INPUT:
Source 1 AP  = <p><span style="color: black;"></span></p>
Source 2 CNN = <p><span style="color: darkblue;"></span></p>
Source 3 Forbes = <p><span style="color: darkred;"></span></p>
Source 4 = <p><span style="color: green;"></span></p>
Source 5  = <p><span style="color: purple;"></span></p>
Source 6  = <p><span style="color: orange;"></span></p>

<rewrite>
Here is your article:
Nume announced his return to the world of beatboxing in a video posted to Youtube on Thursday. (Source 1 AP) 
"I'm back, baby," Nume said after a long-winded speech. "This is a new era for me. I hope it's a newer, better era... and I want to beatbox like never before." (Source 1 AP) (Source 2 CNN)
Nume holds several titles, including the 2019 American Championship title in looping. (Source 2 CNN)
This is his second retirement in two years. (Source 1 AP) 
"I know I've said this before," Nume said, "But I mean it this time. I really do." (Source 4 & Source 6)
Nume turns 30 in November, according to CNN. (Source 1 AP) (Source 2 CNN)
</rewrite>

EXAMPLE OUTPUT WITH EVERY SENTENCE OF THE ARTICLE COLOR CODED AND ON A NEW LINE:
<final-draft>
<p><span style="color: black;">Nume announced his return to the world of beatboxing in a video posted to Youtube on Thursday.</span></p>
<p><span style="color: black;">"I'm back, baby," Nume said after a long-winded speech.</span></p>
<p><span style="color: black;">"This is a new era for me. I hope it's a newer, better era... and I want to beatbox like never before."</span></p>
<p><span style="color: darkblue;">Nume holds several titles, including the 2019 American Championship title in looping.</span></p>
<p><span style="color: black;">This is his second retirement in two years.</span></p>
<p><span style="color: green;">"I know I've said this before," Nume said.</span></p>
<p><span style="color: green;">"But I mean it this time. I really do."</span></p>
<p><span style="color: darkblue;">Nume turns 30 in November, according to CNN.</span></p>
</final-draft>

NOTE: Wrap each sentence in the corresponding paragraph tags, but keep items within a direct quote together as indicated by the example.
`;

// ==========================================================================
// User Prompt
// ==========================================================================

const USER_PROMPT = `
<instructions>
Take the given article and reprint it word for word, but color coded. Reprint it with each sentence on a new line (unless the sentence is INSIDE a direct quote). Each line in the input should be appropriately color coded based on the source list. Each line should be wrapped in the  "<p>" and "<span> tags with no extra spacing. 
</instructions>

<rewrite>
{{#initialSources.0.useVerbatim}}{{stepOutputs.factsBitSplitting.0.text}}{{/initialSources.0.useVerbatim}}
{{stepOutputs.rewriteArticle2.text}}
</rewrite>
`;

// ==========================================================================
// Assistant Prompt
// ==========================================================================

const ASSISTANT_PROMPT = `
<final-draft>
`;

/* ==========================================================================*/
// Route Handler
/* ==========================================================================*/

export async function POST(request: NextRequest) {
  try {
    const body: Step08ColorCodeRequest = await request.json();

    // Validate required fields ------
    const validationError = validateRequest(
      Boolean(body.articleStepOutputs?.rewriteArticle2?.text), 
      {
        colorCodedArticle: "",
      } as Step08ColorCodeAIResponse
    );
    if (validationError) return validationError;

    // Format System Prompt ------
    const finalSystemPrompt = formatPrompt2(SYSTEM_PROMPT, undefined, PromptType.SYSTEM);

    // Format User Prompt ------
    const finalUserPrompt = formatPrompt2(
      USER_PROMPT,
      { 
        stepOutputs: body.articleStepOutputs
      },
      PromptType.USER
    );

    // Format Assistant Prompt ------
    const finalAssistantPrompt = formatPrompt2(ASSISTANT_PROMPT, undefined, PromptType.ASSISTANT);

    // Create a route-specific logger for this step
    const logger = createPipelineLogger(`route-step08-${Date.now()}`);
    logger.logStepPrompts(8, "Color Code", finalSystemPrompt, finalUserPrompt, finalAssistantPrompt);

    // Generate text using messages approach
    const { text: colorCodedArticle } = await generateText({
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
    const response: Step08ColorCodeAIResponse = {
      colorCodedArticle,
    };

    logger.logStepResponse(8, "Color Code", response);

    // Close the logger to ensure logs are flushed
    await logger.close();

    return NextResponse.json(response);
  } catch (error) {
    console.error("Step 08 - Color code failed:", error);

    const errorResponse: Step08ColorCodeAIResponse = {
      colorCodedArticle: "",
    };

    return NextResponse.json(errorResponse, { status: 500 });
  }
}
