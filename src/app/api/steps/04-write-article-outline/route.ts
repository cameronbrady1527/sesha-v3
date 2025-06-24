/* ==========================================================================*/
// route.ts — Step 04: Write Article Outline API Route
/* ==========================================================================*/
// Purpose: Create structural outline for the article with 10+ key points
// Sections: Imports, Configuration, Prompts, Route Handler, Exports

/* ==========================================================================*/
// Imports
/* ==========================================================================*/

// Next.js Core ---
import { NextRequest, NextResponse } from "next/server";

// AI SDK Core ---
import { generateText } from "ai";
import { anthropic } from "@ai-sdk/anthropic";

// Local Utilities ---
import { buildPrompts } from "@/lib/utils";
import { getGlobalLogger } from "@/lib/pipeline-logger";

// Local Types ----
import { Step04WriteArticleOutlineRequest, Step04WriteArticleOutlineAIResponse } from "@/types/digest";

/* ==========================================================================*/
// Configuration
/* ==========================================================================*/

// const model = openai('gpt-4o')
// const model = anthropic("claude-4-sonnet-20250514");
const model = anthropic("claude-3-opus-20240229");

/* ==========================================================================*/
// Schema
/* ==========================================================================*/

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

Each key point should follow this structure:
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

###

Here are examples of well structured outlines you've written in the past:

EXAMPLE 1:
1: In a report for the New York Times, Michael Gunn reported that Navalnaya's call for a polling day protest is a continuation of her husband's political work following his sudden death at a Russian penal colony on 16 February. (Source 1)
2: As part of the protest, Navalnaya encourages people to vote for any candidate except Putin, spoil their ballot, or write "Navalny" in big letters. (Source 1)
3: Alexei Navalny had proposed the idea of a midday gathering at polling stations two weeks before his death as a form of "all-Russian protest action."(Source 1)
4: The Kremlin has claimed Navalny died of natural causes, but his supporters and many foreign leaders blame Putin for his fate. (Source 1)
5: Ukraine's first lady, Olena Zelenska, declined an invitation to sit next to Navlany's widow at the State of the Union address. (Source 1)
6: Though Navalny is considered an anti-corruption icon in the West, his past support for Russian claims on Ukrainian territory have clouded his legacy in Ukraine. (Source 1)
7: The White House claimed Zelenska's decision was probably due to "schedule conflicts". (Source 1)
8: Navalnaya also declined to attend Biden's address, citing fatigue as a factor. (Source 1)
9: French President Emmanuel Macron has urged Ukraine's allies not to be "cowards," while discussing the possibility of sending ground troops to Ukraine. (Source 1)
10: Macron's comments on potentially sending troops have sparked controversy and were quickly clarified to refer only to training or support personnel, not combat roles. (Source 1)
11: Russian President Vladimir Putin's foreign intelligence chief criticized Macron's remarks as "extremely dangerous and irresponsible," highlighting the tension between European leaders and Russia. (Source 1)
12: The Russian invasion of Ukraine has led to the deepest crisis in Moscow's relations with the West since the Cuban Missile Crisis, with Putin warning of the risk of nuclear war if troops are sent to fight in Ukraine. (Source 1)
NOTE: Do not write a conclusion or summary

EXAMPLE 2: 
1: MSNBC anchors Jen Psaki, Joy Reid, and Rachel Maddow mocked GOP primary voters in Virginia live on air for considering immigration their top concern, James P. Hall wrote in an New York Times op-ed. (Source 1)
2: Rachel Maddow criticized her own network for airing Donald Trump's Super Tuesday victory speech, calling it "irresponsible" due to the alleged dissemination of falsehoods. (Source 1)
3: A Gallup survey found that 28% of Americans, including 57% of Republicans, cited immigration as the most important issue, marking the first time in nearly five years that immigration topped the list of concerns among surveyed US adults. (Source 1)
4: MSNBC cut Trump's victory speech to fact-check his claims, particularly regarding the economy and immigration policies.(Source 1)
5: Joy Reid criticized White working-class Republican voters for basing their decisions on race and the concept of an "invasion of Brown people over the border." (Source 1)
6: Rachel Maddow and co-host Stephanie Ruhle fact-checked and criticized Trump's Super Tuesday victory speech. (Source 1)
7: MSNBC host then praised the Biden administration for driving up wages and attacked Trump's handling of the economy during the pandemic. (Source 1)
8: Critics, including politicians and viewers, accused MSNBC of being disconnected and arrogant toward voters' immigration concerns. (Source 1)
9: The mocking segment on MSNBC drew sharp backlash from conservatives and even anti-Trump figures, who labeled the network's attitude as arrogant and out of touch. (Source 1)
10: In his victory speech, Donald Trump pledged to tackle illegal border crossings, claiming that "Biden migrant crime" had made the US the mockery of the world. (Source 1)
11: He pledged to close the border and deport 'a lot of people' (Source 1)
12: Throughout his speech, the crowd broke into chants of "USA, USA, USA". (Source 1)
13: Republicans have ensured that immigration is a visible issue by busing migrants to locations like New York and Martha's Vineyard, according to Hall. (Source 1)
14: Analyst Van Jones claims that Democrats can win on immigration if Biden adopts a more "mainstream" position, rather than the polarizing stances of hardcore Democrats or Republicans. (Source 1)
15: Former President Trump carried Virginia easily Tuesday night as part of a string of primary victories, with immigration being a top priority for Republican voters according to exit poll, argues Hall. (Source 1)
NOTE: Do not write a conclusion or summary

EXAMPLE 3:
1: Nikki Haley will announce her exit from the Republican presidential race, clearing the path for Donald Trump, writes analyst Mitch Strongbom for the New York Times (Source 1)
2: Despite Trump's dominance on Super Tuesday, the Biden campaign labels him as "wounded, dangerous, and unpopular," asserting a clear path to victory. (Source 1)
3: Biden's re-election campaign plans to target moderate and Haley voters disillusioned with Trump, aiming to win their support in the general election. (Source 1)
4: Despite Trump's Super Tuesday success, a notable number of Republican voters in key states are hesitant to support the GOP candidate in November. (Source 1)
5: Haley's unexpected victory in Vermont and strong performances in other states indicate a substantial portion of Republican voters have reservations about Trump, argues Strongbom (Source 1)
6: The Biden campaign has declared a "clear path to victory" despite Trump's significant wins on Super Tuesday. (Source 1)
7: The memo criticizes Trump as "wounded, dangerous, and unpopular," despite his Super Tuesday victories. (Source 1)
8: Despite concering poll numbers, the campaign has decided to downplay the stats and instead focus on the undecided voters as a promising sign for Biden's re-election. (Source 1)
9: Mitch Landrieu, Biden Campaign National Co-Chair, criticizes Trump's "low energy" and allegedly falsehood-filled victory speech. (Source 1)
10: Democrats are beginning to panic as Trump's campaign fails to implode. (Source 1)
11: Biden is trailing Trump in polls underscoring concerns that his message isn't gaining traction with swing voters. (Source 1)
12: The Supreme Court's unanimous decision in Trump's favor in a 14th Amendment case has dealt a massive blow to Democrats who had hoped it would cripple him. (Source 1)
13: Ukraine's First Lady Olena Zelenska declined the State of the Union invitation to sit next to Navalny's widow because of Navalny's previous support for Russia's territorial claims on Ukraine. (Source 1)
14: President Biden is preparing for his State of the Union address amid a politically divided Congress, with plans to tout his administration's achievements. (Source 1)
15: It will be the latest ever State of the Union address. (Source 1)
NOTE: Do not write a conclusion or summary

EXAMPLE 4:
1: Gary Goldsmith reveals on Celebrity Big Brother that Kate Middleton is recovering well from her surgery, receiving "the best care in the world." (Source 1)
2: Dismissing conspiracy theories, Goldsmith assures viewers that Kate will return to her public duties, saying, "She'll be back, of course she will." (Source 1)
3: Amid discussions on the Duchess's health, Goldsmith states that Prince Harry and Meghan Markle should have their royal titles removed. (Source 1)
4: Goldsmith said that it annoyed him when people said Kate was common, pointing out that her parents were multimillionaires before they were 30. (Source 1)
5: The comments Goldsmith made on Harry and Meghan have enraged viewers, with some even threatening to "switch off" the show. (Source 1)
6: The businessman's remarks about the Duke and Duchess of Sussex have also enraged his housemates, leading to his nomination for eviction by Sharon Osbourne. (Source 1)
7 Goldsmith had said that the Sussexes should lose their royal titles. (Source 1)
8: Separately, a pair of Prince Harry's underwear, allegedly worn during a notorious Las Vegas party, was sold at auction for nearly £200,000 to a San Diego strip club owner. (Source 1) 
9: The buyer, Dino Palmiotto, plans to use the underwear as part of a shrine to Prince Harry, describing them as a piece of history from Harry's "playboy days." (Source 1)
10: OnlyFans has banned the seller, Carrie Royale, for threatening to share non-consensual intimate images of the prince. (Source 1)
NOTE: Do not write a conclusion or summary

####

Use this summary to determine the angle of how to report on the source content:
{{summarize_facts}}
`;

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
{{headlines_and_blobs}}

Editor Notes (IMPORTANT): 
{{editor_instructions}}

Make sure to include the author or context of the source in key point one (was it an opinion piece by x author? was it a study published by x group? etc)

Make sure the article will be easy to understand, even if the source text is complex (like a study or press release).
Make sure that the outline and article is extremely long and comprehensive, and that complex concepts or phrases are explained (using the source content)

###

Here are source articles that should be used for reference:

Source 1: {{source_accredit}}
Description: {{source_description}}
--
{{source_text}}

###
Summary and facts to use as reference:
<summary>
{{summarize_facts}}

Quotes to use as additional reference:
{{extract_fact_quotes}}
`;

/* ==========================================================================*/
// Route Handler
/* ==========================================================================*/

export async function POST(request: NextRequest) {
  try {
    const body: Step04WriteArticleOutlineRequest = await request.json();

    // Validate required fields
    if (!body.sourceText) {
      return NextResponse.json(
        {
          outline: "",
        },
        { status: 400 }
      );
    }

    // Prepare editor instructions block
    const editorInstructionsBlock = body.instructions
      ? `You must follow these important mandatory editor instructions: 
<mandatory-editor-instructions>${body.instructions}</mandatory-editor-instructions>`
      : "";

    // Build prompts using the helper function
    const [systemPrompt, userPrompt] = buildPrompts(
      SYSTEM_PROMPT,
      USER_PROMPT,
      {
        summarize_facts: body.summarizeFactsText || "",
      },
      {
        headlines_and_blobs: body.headlineAndBlobsText || "",
        editor_instructions: editorInstructionsBlock,
        source_accredit: body.sourceAccredit || "",
        source_description: body.sourceDescription || "",
        source_text: body.sourceText || "",
        summarize_facts: body.summarizeFactsText || "",
        extract_fact_quotes: body.extractFactQuotesText || "",
      }
    );

    // Log the formatted prompts if logger is available
    const logger = getGlobalLogger();
    if (logger) {
      logger.logStepPrompts(4, "Write Article Outline", systemPrompt, userPrompt);
    }

    // Generate structured object using AI SDK
    const { text: outline } = await generateText({
      model,
      system: systemPrompt,
      prompt: userPrompt,
      temperature: 0.6,
    });

    // Build response - only AI data
    const response: Step04WriteArticleOutlineAIResponse = {
      outline: outline,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Step 04 - Write article outline failed:", error);

    const errorResponse: Step04WriteArticleOutlineAIResponse = {
      outline: "",
    };

    return NextResponse.json(errorResponse, { status: 500 });
  }
}
