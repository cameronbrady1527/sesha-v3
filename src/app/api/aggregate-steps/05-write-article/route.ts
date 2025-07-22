/* ==========================================================================*/
// route.ts — Step 05: Write Article API Route
/* ==========================================================================*/
// Purpose: Generate complete article from outline and source content
// Sections: Imports, Configuration, Prompts, Route Handler, Exports

/* ==========================================================================*/
// Imports
/* ==========================================================================*/

// Next.js Core ---
import { NextRequest, NextResponse } from "next/server";

// AI SDK Core ---
import { generateText } from "ai";

// Local Utilities ---
import { formatPrompt2, PromptType, validateRequest, getCurrentDate } from "@/lib/utils";
import { createPipelineLogger } from "@/lib/pipeline-logger";

// Local Types ----
import { Step05WriteArticleRequest, Step05WriteArticleAIResponse } from "@/types/aggregate";
import type { LengthRange } from "@/db/schema";
import { anthropic } from "@ai-sdk/anthropic";

/* ==========================================================================*/
// Configuration
/* ==========================================================================*/

const MODEL = anthropic("claude-3-5-sonnet-20240620");
const TEMPERATURE = 0.7;
const MAX_TOKENS = 3000;

// Word target mapping
const WORD_TARGET_MAP: Record<LengthRange, number> = {
  "100-250": 100,
  "400-550": 500,
  "700-850": 750,
  "1000-1200": 1300,
};

// ==========================================================================
// System Prompts
// ==========================================================================

const SYSTEM_PROMPT_DEFAULT = `
You are an expert senior news editor writing an article that is an aggregation of multiple source articles. You write detailed, factual articles that weave together the facts and quotes from the source articles into a cohesive version that includes all of the angles and developments in the story. You use clear, factual language and many direct quotes from things people said to craft the article based on the provided outline and the source article inputs. IMPORTANT: When writing, combine facts and details from the inputs in your own words, but keep direct quotes 100% accurate and contextually true. Anything presented as a direct quote must also have been inside quotation marks as a direct quote in a source article input.

Write an article that is {{word_target}} words long that weaves together the facts from source article inputs in your own words. Add to the provided outline, filling it out with more facts, direct quotes from people in the source articles, and other information from the source articles to write the article that is {{word_target}} words long. 

{{sentence_guidance}}

Here are the most important instructions for the content, writing style, tone, and structure:
- You must use the best direct quotes from things people were quoted as saying in the source articles. Do not alter direct quotes—they must be kept perfectly verbatim
- Use the conflict or unpleasant content or quotes in the source content (think juicy tabloid)
- Focus on direct quotes from people quoted in the source articles and the most dramatic and timely events
- IMPORTANT: Use the editor notes (if provided) when crafting the article
- Work from the general structure provided by the outline, but weave together details and information from the source list to bolster each key point to write the article in full without any repetition of phrases or concepts
- Use a lot of direct quotes from people from the source list (content in quotation marks) but make sure to vary the attribution to direct quotes from the source material. NOTE: You can only use direct quotes that were ALREADY direct quotes INSIDE quotation marks in the source article inputs 
- Make sure to paraphrase and weave together the facts in your own words, but do NOT add extra analysis or editorializing
- Use references to time to structure the article and use timing to transition through the article (Meanwhile, Later, Last year, A week ago, Days before, last month, etc)
- Pull from every one of the sources and intersperse them to craft the article
- Make sure to move logically through the article with no repetition of quotes or phrases
- Explain WHO people are and WHEN things happened to give context to the article (referencing the source articles)
- The article should start with the most new/timely event or development (generally the same angle as the headline) and then move logically through each event or development until the article is complete
- You MUST weave together information from every one of the source articles
- Make sure to give the reader context (from the sources) for each of the details. Explain who people are, when things happened, and how things relate as you move through the events of the article.
- No repetition (The article should tell each key point of the story in full before moving logically through the events and developments without repeating lines/quotes)
- Absolutely no analysis or conclusion at the end of the article (just end after comprehensively moving through the facts & direct quotes from people)
- IMPORTANT: The sources are listed in order of importance, so don't focus too much on the later source articles. Focus the most on source articles 1 and 2.

{{#instructions}}IMPORTANT EDITOR NOTE:{{instructions}}{{/instructions}}

###

Sentence Format Instructions: 
Each sentence should use a source tag to show where it was sourced from. Each sentence or direct quote should appear on a new line:
Example Format: 
Quote from someone or newly authored sentence referencing facts and details from the sources. (Source Number & Name for each source referenced)
Quote from someone or newly authored sentence referencing facts and details from the sources. (Source Number & Name for each source referenced)
Quote from someone or newly authored sentence referencing facts and details from the sources. (Source Number & Name for each source referenced)

EXAMPLE ARTICLES
Here are example articles you've written in the past. They are the correct length and writing style, and they move logically through the news story.

{{example_articles}}
`;

const SYSTEM_PROMPT_VERBATIM = `
You are an expert senior news editor writing an article that is an aggregation of multiple source articles. You write detailed, factual articles that weave together the facts and quotes from the source articles into a cohesive version that includes all of the angles and developments in the story. You use clear, factual language and many direct quotes from things people said to craft the article based on the provided outline and the source article inputs. IMPORTANT: When writing, combine facts and details from the inputs in your own words, but keep direct quotes 100% accurate and contextually true. Anything presented as a direct quote must also have been inside quotation marks as a direct quote in a source article input.

Write an article that is {{word_target}} words long that weaves together the facts from source article inputs in your own words. Add to the provided outline, filling it out with more facts, direct quotes from people in the source articles, and other information from the source articles to write the article that is {{word_target}} words long. 

{{sentence_guidance}}

IMPORTANT: You must start the article with the editor-provided opening text verbatim. The opening text should flow seamlessly into the rest of the article.

Here are the most important instructions for the content, writing style, tone, and structure:
- You must use the best direct quotes from things people were quoted as saying in the source articles. Do not alter direct quotes—they must be kept perfectly verbatim
- Use the conflict or unpleasant content or quotes in the source content (think juicy tabloid)
- Focus on direct quotes from people quoted in the source articles and the most dramatic and timely events
- IMPORTANT: Use the editor notes (if provided) when crafting the article
- Work from the general structure provided by the outline, but weave together details and information from the source list to bolster each key point to write the article in full without any repetition of phrases or concepts
- Use a lot of direct quotes from people from the source list (content in quotation marks) but make sure to vary the attribution to direct quotes from the source material. NOTE: You can only use direct quotes that were ALREADY direct quotes INSIDE quotation marks in the source article inputs 
- Make sure to paraphrase and weave together the facts in your own words, but do NOT add extra analysis or editorializing
- Use references to time to structure the article and use timing to transition through the article (Meanwhile, Later, Last year, A week ago, Days before, last month, etc)
- Pull from every one of the sources and intersperse them to craft the article
- Make sure to move logically through the article with no repetition of quotes or phrases
- Explain WHO people are and WHEN things happened to give context to the article (referencing the source articles)
- The article should start with the most new/timely event or development (generally the same angle as the headline) and then move logically through each event or development until the article is complete
- You MUST weave together information from every one of the source articles
- Make sure to give the reader context (from the sources) for each of the details. Explain who people are, when things happened, and how things relate as you move through the events of the article.
- No repetition (The article should tell each key point of the story in full before moving logically through the events and developments without repeating lines/quotes)
- Absolutely no analysis or conclusion at the end of the article (just end after comprehensively moving through the facts & direct quotes from people)
- IMPORTANT: The sources are listed in order of importance, so don't focus too much on the later source articles. Focus the most on source articles 1 and 2.

{{#instructions}}IMPORTANT EDITOR NOTE:{{instructions}}{{/instructions}}

###

Sentence Format Instructions: 
Each sentence should use a source tag to show where it was sourced from. Each sentence or direct quote should appear on a new line:
Example Format: 
Quote from someone or newly authored sentence referencing facts and details from the sources. (Source Number & Name for each source referenced)
Quote from someone or newly authored sentence referencing facts and details from the sources. (Source Number & Name for each source referenced)
Quote from someone or newly authored sentence referencing facts and details from the sources. (Source Number & Name for each source referenced)

EXAMPLE ARTICLES
Here are example articles you've written in the past. They are the correct length and writing style, and they move logically through the news story.

{{example_articles}}
`;

// ==========================================================================
// User Prompt
// ==========================================================================

const USER_PROMPT = `
<instructions>
You are an expert senior news editor. Write a cohesive, comprehensive article that is an aggregation of the information in the provided source articles. Start with the lede (based on the headline) and then move logically through the outline by filling out each key point with the events and context provided in the source articles. Use every relevant detail from the source articles, and use every relevant direct quote from them (without repetition). Weave together the facts and direct quotes from the source article list, interspersing content from each of the source articles, to author this new cohesive aggregation written in your own words. Keep direct quotes 100% accurate and do not add any analysis not provided in the source articles.

The events and claims of the article must be based fully in the source article inputs and must be accurate.

{{stepOutputs.headlinesblobs.text}}

Here is a short outline for the article. Follow the outline and add additional facts, details, and direct quotes from the source articles to write the FULL {{word_target}}-word article. It should be detailed and comprehensive as it moves logically through each key point in order.
<outline>
{{stepOutputs.writeArticleOutline.text}}
</outline>

Editor Notes:
{{#instructions}}IMPORTANT EDITOR NOTE:<editor note>{{instructions}}</editor note>{{/instructions}}
Make sure to reference WHEN events or statements happened, and introduce the person, explain the context, date, location, or person the FIRST time each new detail is introduced (and only the first time)
The sources are numbered in order of importance, so don't focus too much on the later sources. Source 1 and 2 are most important.
Weave the source articles together (interspersing facts and direct quotes ACROSS sources) to create a new cohesive article that moves logically through the story
IMPORTANT: Write each sentence in your words by referencing facts and details provided by the various sources, but keep any and all direct quotes from things other people were QUOTED as saying 100% accurate. You can only use direct quotes that were ALREADY direct quotes INSIDE quotation marks in the source article inputs 
The lede (the first sentence) must be punchy and pithy and based on key point 1
NOTE: You can only put things in direct quotes that were already in direct quotes in the source articles, and make sure to vary the crediting so that it isn't repetitive (you don't have to give a speaker's full intro after every direct quote)
When using direct quotes, the speaker tags should be simple (use "said" instead of asserted. for example 'X person said: "[insert quote]"' or '"[insert quote]," wrote X person.')
In the article copy, numbers under 10 should be spelled out (eg "six")
You must use simple, straightforward, nonrepetitive language so that the general audience can understand the content of the article, and use SPECIFIC details from the source articles (dates, names, locations, etc)
For example, rather than writing something clunky and vague like "Sharing his thoughts on the health topic, Biden said he 'wouldn't expect it to get better,' emphasizing his concern." You would write something SPECIFIC, PITHY, and CLEAR like "Biden said he "wouldn't expect it to get better.'" since the quote speaks for itself and there is no need for extra analysis. 
Today's Date: {{date}}

{{#initialSources.0.useVerbatim}}You MUST begin the article with this exact FULL text with (Source 1 {{initialSources.0.accredit}}) written after each line: 
<article-opening>
{{stepOutputs.factsBitSplitting.0.text}}
</article-opening>
Note: make sure the sentences after flow seamlessly from the editor-written opening.{{/initialSources.0.useVerbatim}}

The article must be at least {{word_target}} words long. The more detail the better (but no repetition).

{{sentence_guidance}}

NOTE: you must use content from every one of the input source articles provided. The articles are provided in order of importance. Source 1 is most important.
</instructions>

Source Article Input List (craft the aggregated news article from these source article inputs):

NOTE: You may only include direct quotes in your article if they were already inside quotation marks as direct quotes in the source material

<input source article 1>
{{#initialSources.0.useVerbatim}}
You MUST begin the article with this exact FULL text with (Source 1 {{initialSources.0.accredit}}) written after each line:
<article-opening>{{stepOutputs.factsBitSplitting.0.text}}</article-opening>
{{/initialSources.0.useVerbatim}}
{{^initialSources.0.useVerbatim}}
{{#initialSources.0.isPrimarySource}}Make sure to credit the author and publication when referencing this source: {{/initialSources.0.isPrimarySource}}
Source 1: This is the most important source (Pull as much content as possible from this source)
<source-1-content>
{{stepOutputs.factsBitSplitting.0.text}}{{stepOutputs.factsBitSplitting2.0.text}}
</source-1-content>
{{/initialSources.0.useVerbatim}}
</input source article 1>

{{#stepOutputs.factsBitSplitting.1.text}}
This is the second most important source:
{{#initialSources.1.isPrimarySource}}Make sure to credit the author and publication when referencing this source: {{/initialSources.1.isPrimarySource}}
<input source article 2>
<source-2-content>
{{stepOutputs.factsBitSplitting.1.text}}{{stepOutputs.factsBitSplitting2.1.text}}
</source-2-content>
</input source article 2>
{{/stepOutputs.factsBitSplitting.1.text}}

{{#stepOutputs.factsBitSplitting.2.text}}
This is the third most important source:
{{#initialSources.2.isPrimarySource}}Make sure to credit the author and publication when referencing this source: {{/initialSources.2.isPrimarySource}}
<input source article 3>
<source-3-content>
{{stepOutputs.factsBitSplitting.2.text}}{{stepOutputs.factsBitSplitting2.2.text}}
</source-3-content>
</input source article 3>
{{/stepOutputs.factsBitSplitting.2.text}}

{{#stepOutputs.factsBitSplitting.3.text}}
This is the fourth most important source (only take a bit from this):
{{#initialSources.3.isPrimarySource}}Make sure to credit the author and publication when referencing this source: {{/initialSources.3.isPrimarySource}}
<input source article 4>
<source-4-content>
{{stepOutputs.factsBitSplitting.3.text}}{{stepOutputs.factsBitSplitting2.3.text}}
</source-4-content>
</input source article 4>
{{/stepOutputs.factsBitSplitting.3.text}}

{{#stepOutputs.factsBitSplitting.4.text}}
This is the fifth most important source (take very little from this):
{{#initialSources.4.isPrimarySource}}Make sure to credit the author and publication when referencing this source: {{/initialSources.4.isPrimarySource}}
<input source article 5>
<source-5-content>
{{stepOutputs.factsBitSplitting.4.text}}{{stepOutputs.factsBitSplitting2.4.text}}
</source-5-content>
</input source article 5>
{{/stepOutputs.factsBitSplitting.4.text}}

{{#stepOutputs.factsBitSplitting.5.text}}
This is the sixth most important source (take very little from this):
{{#initialSources.5.isPrimarySource}}Make sure to credit the author and publication when referencing this source: {{/initialSources.5.isPrimarySource}}
<input source article 6>
<source-6-content>
{{stepOutputs.factsBitSplitting.5.text}}{{stepOutputs.factsBitSplitting2.5.text}}
</source-6-content>
</input source article 6>
{{/stepOutputs.factsBitSplitting.5.text}}
`;

// ==========================================================================
// Assistant Prompt
// ==========================================================================

const ASSISTANT_PROMPT = `
Here is the {{word_target}} word article based on the provided source content and editor notes. 

Additional notes on the article;
- This article weaves together and intersperses the facts and direct quotes reported in the source articles to logically and holistically cover the story in my own words (with direct quotes kept unaltered and 100% verbatim to the source article inputs)
- Each sentence references the source articles from which the information or direct quotes came in source tags, for example: (Source 1 {{initialSources.0.accredit}}, Source 3 {{initialSources.2.accredit}})
- I have included the most interesting direct quotes from people quoted in the source articles, with a focus on the first source articles and less focus on the later source articles. I have kept direct quotes from people verbatim and I only included direct quotes that were already direct quotes inside quotation marks in the source article inputs. I have altered the phrasing of the speaker credits (for example, so-and-so said) to avoid plagiarism
- There is no repetition in the article
- I have not written a summary or conclusion at the end, I have instead simply ended the article after presenting the final facts and direct quotes
- The article is {{word_target}} words long 
- The article is written in a pithy, newsy style. Instead of phrases like "person said XYZ, emphasizing the gravity of the situation," I write in a pithy style writing phrases like "person said XYZ," so that I am not injecting repetition or analysis

<aggregation>{{#initialSources.0.useVerbatim}}{{stepOutputs.factsBitSplitting.0.text}}{{/initialSources.0.useVerbatim}}
`;

/* ==========================================================================*/
// Helper Functions
/* ==========================================================================*/

/**
 * Get sentence guidance based on word target
 * 
 * @param wordTarget - Target word count for the article
 * @returns String with appropriate sentence guidance
 */
function getSentenceGuidance(wordTarget: number): string {
  if (wordTarget === 100) {
    return "IMPORTANT: The article should be around 5 sentences long.";
  } else if (wordTarget === 500) {
    return "IMPORTANT: The article should be around 15 sentences long.";
  } else if (wordTarget === 750) {
    return "IMPORTANT: The article should be around 25 sentences long.";
  } else if (wordTarget === 1300) {
    return "IMPORTANT: The article should be around 40 sentences long.";
  }
  return "";
}

/**
 * Get example articles based on word target
 * 
 * @param wordTarget - Target word count for the article
 * @returns String containing appropriate examples
 */
function getExampleArticles(wordTarget: number): string {
  if (wordTarget === 100) {
    return `
Example 1 (your output):
<aggregation>
Former U.N. Ambassador Nikki Haley has upped her attacks on former President Donald Trump, calling him "more diminished than he was" and "unhinged." (Source 1 NBC News, Source 2 Reuters)

In an interview on Tuesday with "TODAY", Haley defended her past support for Trump, stating, "During the time that I was in the administration, I called him out every single time," said NBC News. (Source 1 NBC News)

Then she took a swing at the President: "You've got Joe Biden, where the special counsel said he was diminished, and he's not the Joe Biden he was two years ago. You've got a Donald Trump who's unhinged, and he's more unhinged than he ever was. And why are we settling for that when the country is in disarray and the world is on fire?" Haley said. (Source 2 Reuters, Source 3 ABCNews)

Meanwhile, Haley's husband, Maj. Michael Haley, who is currently deployed in Africa, posted a viral meme on Twitter. The meme featured a photograph of a wolf with the statement: "The difference between humans and animals? Animals would never allow the dumbest ones to lead the pack," according to ABCNews. (Source 3 ABCNews)
</aggregation>

Example 2 (your output):
<aggregation>
Sir Trevor McDonald, the iconic newsreader, is stepping out of retirement once again. (Source 1 The Sun, Source 2)

The 84-year-old is teaming up with comedian and musician Bill Bailey for a pub walk in Essex on Channel 4's digital station More4 on Tuesday, February 26th, reports the Sun. (Source 1 The Sun, Source 3 the Mirror)

The duo will take viewers on a journey through the areas that inspired artist John Constable, including Dedham Vale, the Essex and Suffolk border, and the Stour Estuary. (Source 2)

This comeback is not McDonald's first since his initial retirement in 2005, reported the Mirror. He briefly returned to the screen in 2007 and has since been involved in various projects, including presenting ITV specials and documentaries. (Source 2, Source 3 The Mirror)
</aggregation>
`;
  } else if (wordTarget === 500) {
    return `
Example 1 (your output):
<aggregation>
Nikki Haley, the former U.N. Ambassador and South Carolina Governor, has intensified her critique of Donald Trump, her only rival for the GOP nomination, while defending her past support for the former president. (Source 1 NBCNews, Source 2 ABCNews, Source 3)

In an interview on Tuesday with "TODAY" co-host Craig Melvin, Haley said that Trump is "more diminished than he was" and labeled both him and President Joe Biden as "diminished," advocating for a new generation of leadership, reported NBCNews. (Source 1 NBCNews, Source 3)

"During the time that I was in the administration, I called him out every single time. If something was wrong — I had a conversation with him about Charlottesville, I had a conversation about something that he would say about women, I had a conversation with him about multiple things," Haley said, justifying her previous support for Trump. (Source 1 NBCNews, Source 2 ABCNews)

Haley's comments come amid a heated battle to catch up in the GOP race, with the South Carolina primary looming on February 24 and Super Tuesday just 10 days later. (Source 1 NBCNews)

Adding to the drama, Haley's husband, Maj. Michael Haley, who is currently deployed in Africa with the South Carolina Army National Guard, posted a viral meme on Twitter mocking Trump's intelligence and leadership, said ABCNews. (Source 2 ABCNews)

The meme featured a photograph of a wolf with the statement: "The difference between humans and animals? Animals would never allow the dumbest ones to lead the pack," tagging Donald Trump, the GOP, and news outlets including CNN and the AP. (Source 2 ABCNews, Source 3)

In response to Trump's comments, Nikki Haley tweeted, "Someone who continually disrespects the sacrifices of military families has no business being the commander in chief," marking a change from the early days of her presidential campaign when she largely avoided attacking Trump directly. (Source 2 ABCNews)

She said: "You're going to mock my husband, who's deployed 8,000 miles away? What does that say about someone who wants to be commander-in-chief? Because as a military spouse, it makes me worry about Michael's safety. As someone who was in national security, it makes me worry about the future for our kids with him starting a war." (Source 2 ABCNews)

Haley's campaign and allies have used Trump's comments to argue that he cares little for veterans, leading to media appearances and ads. (Source 1 NBCNews, Source 2 ABCNews)

One such ad, released by the super PAC supporting Haley, bashes Trump for a "sick pattern" of rhetoric toward the military, following attacks by the former president on Haley's husband. (Source 2 ABCNews, Source 3)

Despite the uphill battle in the polls, with a CBS News survey showing Trump leading Haley 65 percent to 30 percent among likely GOP voters in South Carolina, Haley remains determined to continue her campaign. (Source 1 NBCNews, Source 3)

"We will go to Michigan and Super Tuesday. We have a country to save. I'm not going anywhere because I don't want my kids to live like this," Haley told CNN, indicating her resolve to soldier on in the primary regardless of South Carolina's results, ABCNews noted. (Source 1 NBCNews, Source 2 ABCNews)
</aggregation>

Example 2 (your output):
<aggregation>
Stephen A. Smith came to the defense of journalist Megyn Kelly on Monday following her controversial comments about the Black National Anthem's performance at the Super Bowl. (Source 1 The Hill, Source 2)

Kelly had sparked a heated debate on social media after criticizing the inclusion of "Lift Every Voice and Sing," widely recognized as the Black National Anthem, alongside the traditional "Star-Spangled Banner" during the Super Bowl festivities. (Source 1 The Hill, Source 3 AOLNews)

"The so-called Black National Anthem does not belong at the Super Bowl. We already have a National Anthem and it includes EVERYONE," Kelly wrote on X, formerly known as Twitter, on Sunday evening, according to The Hill. (Source 1 The Hill)

Smith, however, cautioned against labeling Kelly's remarks as racist. (Source 1 The Hill, Source 2)

"You don't know that about her. And when you say something like that, you dilute the potency and the importance of the argument," Smith said on his show on Monday. (Source 1 The Hill)

"I'm sick and tired of folks out there — particularly in the Black community — being so quick to throw out the word 'racism.' When you throw out the word 'racism,' do me a favor, have more evidence before you do it, so it can't be dismissed via plausible deniability or something else," Smith said, as reported by the NY Post. (Source 2, Source 3 AOLNews)

Addressing Kelly directly, Smith said: "Megyn Kelly, if you're watching, you're listening: I don't like what you said at all. I think it comes across as highly insensitive. You cannot take into account history. You cannot acknowledge because you are historian. I've heard you, I've watched you, I've listened to you – profound respect for you." (Source 2)

He added, "But you ain't Black. You haven't been marginalized and ostracized and treated in the manner that Black people have been treated." (Source 1 The Hill)

Smith's comments come amid a backdrop of social media users supporting Kelly, with some calling the Black National Anthem "a manufactured push for segregation that the masses do not support" and others claiming it was created "to cause division," the NY Post reported. (Source 2, Source 3 AOLNews)

Meanwhile, the Super Bowl also featured a performance of the National Anthem by country music star Reba McEntire, which received widespread praise, according to AOLNews. (Source 1 The Hill, Source 3 AOLNews)

McEntire, a 68-year-old Grammy winner, delivered a 95-second rendition of the anthem, wearing a gold blazer, embellished black pants, and an oversized gold belt buckle. (Source 3 AOLNews)

In an interview with Apple Music, McEntire revealed that her boyfriend, Rex Linn, played a significant role in her decision to sing the National Anthem at the Super Bowl. (Source 2,  Source 3 AOLNews)

"We were thrilled to be asked. I'm honored. This is my 50th year of getting to sing the National Anthem," McEntire said. (Source 1 The Hill, Source 2, Source 3 AOLNews)
</aggregation>
`;
  } else {
    // For 1000 and 1200 word targets, use longer examples
    return `
Example 1 (your output):
<aggregation>
Yale University announced on Thursday that it will reinstate the requirement for prospective students to submit standardized test scores when applying for admission, a policy that was suspended nearly four years ago due to the pandemic. (Source 1, Source 2 USAToday, Source 4 Yale Statement)

The decision, which will come into effect for all first-year applicants beginning in the fall of 2025, aims to address concerns about diversity and equity in the admissions process, NBCNews reported. (Source 1, Source 2 USAToday, Source 3 FoxNews)

"Let's start with what we know to be true: every standardized test is imperfect and incomplete. No exam can demonstrate every student's college readiness or perfectly predict future performance," Yale said in a press statement released Thursday. (Source 1, Source 2 USAToday)

"Yale has not, does not, and will never rely on testing alone to assess student preparedness," the statement added. (Source 1, Source 3 FoxNews)

Prospective students will also be able to include Advanced Placement or International Baccalaureate exam scores in place of the ACT or SAT. (Source 2 USAToday)

This move follows a similar decision by Dartmouth College earlier this month which was based on the belief that standardized test scores, when evaluated alongside high school grades, are "the most reliable indicators for success in Dartmouth's course of study," according to USAToday. (Source 2 USAToday, Source 3 FoxNews, Source 4 Yale Statement)

The university said that ditching ACT or SAT scores had been a "positive experience," but that it actually worked to the disadvantage of poorer students because more weight was placed on other factors like rigorous high school courses and extracurricular activities "full of enrichment opportunities." (Source 2 USAToday, Source 4 Yale Statement)

Yale also said that teachers at these schools are more "accustomed to praising students' unique classroom contributions," while "teachers with large classes may use positive but generic words of praise in recommendation letters."   (Source 1, Source 2 USAToday)

"Students' out-of-school commitments may include activities that demonstrate extraordinary leadership and contributions to family and community but reveal nothing about their academic preparedness.  (Source 1, Source 4 Yale Statement)

"With no test scores to supplement these components, applications from students attending these schools may leave admissions officers with scant evidence of their readiness for Yale," the statement said. (Source 1, Source 4 Yale Statement)

Opponents of the decision have argued that such tests often favor students from wealthier backgrounds who can afford test preparation services, USAToday noted. (Source 2 USAToday, Source 3 FoxNews)

Meanwhile, a group of Yale faculty members launched an initiative last week called "Faculty for Yale," advocating for free expression and institutional neutrality, according to FoxNews. (Source 2 USAToday, Source 3 FoxNews)

The initiative aims to "rededicate" the university to its "fundamental mission" of preserving, producing, and transmitting knowledge, in the face of what its members see as a challenge to these values. (Source 2 USAToday, Source 3 FoxNews)

The group's efforts come at a time when free speech concerns remain prevalent on campuses across the U.S., with the House of Representatives' education committee recently unveiling a report detailing attacks on free speech infringement on college campuses, Yale said. (Source 3 FoxNews, Source 4 Yale Statement)

The report sounded the alarm over alleged partisanship and political activism, including shout-downs, cancellations, and rescinded invitations for guest speakers. (Source 1, Source 3 FoxNews, Source 4 Yale Statement)

The "Faculty for Yale" web page claims: "Some of these changes pertain to the freedom of academic expression; others do not. (Source 1, Source 4 Yale Statement)

"But all are motivated by the perception that Yale today appears to be struggling to meet its most important responsibilities as an academic institution in a clear and consistent way," the page said. (Source 3 FoxNews, Source 4 Yale Statement)

This initiative already has had over 100 faculty members reportedly sign up to encourage free expression and other values, according to the university statement. (Source 2 USAToday, Source 3 FoxNews,  Source 4 Yale Statement)

The group also emphasizes the importance of maintaining a tolerant and broad-minded campus ethos and culture, while urging a commitment to greater transparency. (Source 1, Source 2 USAToday, Source 3 FoxNews,  Source 4 Yale Statement)

The initiative's webpage reads, "One important corollary is that Yale as an institution should not prescribe any moral or political positions as institutional orthodoxy or treat the failure to endorse such a position as grounds for sanction or exclusion, whether formal or informal." (Source 1, Source 4 Yale Statement)
</aggregation>
`;
  }
}

/* ==========================================================================*/
// Route Handler
/* ==========================================================================*/

export async function POST(request: NextRequest) {
  try {
    const body: Step05WriteArticleRequest = await request.json();

    // Validate required fields ------
    const validationError = validateRequest(
      Boolean(body.length) && Boolean(body.articleStepOutputs), 
      {
        article: "",
      } as Step05WriteArticleAIResponse
    );
    if (validationError) return validationError;

    // Get word target from mapping
    const wordTarget = WORD_TARGET_MAP[body.length];
    if (!wordTarget) {
      return NextResponse.json(
        {
          article: "",
        } as Step05WriteArticleAIResponse,
        { status: 400 }
      );
    }

    // Determine which system prompt to use based on verbatim flag
    const isVerbatim = body.sources?.[0]?.useVerbatim || false;
    const systemPromptTemplate = isVerbatim ? SYSTEM_PROMPT_VERBATIM : SYSTEM_PROMPT_DEFAULT;

    // Get sentence guidance and example articles based on word target
    const sentenceGuidance = getSentenceGuidance(wordTarget);
    const exampleArticles = getExampleArticles(wordTarget);
    const currentDate = getCurrentDate();

    // Format System Prompt ------
    const finalSystemPrompt = formatPrompt2(
      systemPromptTemplate,
      { 
        word_target: wordTarget,
        sentence_guidance: sentenceGuidance,
        example_articles: exampleArticles,
        instructions: body.instructions,
        date: currentDate
      },
      PromptType.SYSTEM
    );

    // Format User Prompt ------
    const finalUserPrompt = formatPrompt2(
      USER_PROMPT,
      { 
        length: body.length,
        instructions: body.instructions,
        initialSources: body.sources,
        stepOutputs: body.articleStepOutputs,
        word_target: wordTarget,
        sentence_guidance: sentenceGuidance,
        date: currentDate
      },
      PromptType.USER
    );

    // Format Assistant Prompt ------
    const finalAssistantPrompt = formatPrompt2(
      ASSISTANT_PROMPT,
      { 
        word_target: wordTarget,
        initialSources: body.sources
      },
      PromptType.ASSISTANT
    );

    // Create a route-specific logger for this step
    const logger = createPipelineLogger(`route-step05-${Date.now()}`);
    logger.logStepPrompts(5, "Write Article", finalSystemPrompt, finalUserPrompt, finalAssistantPrompt);

    // Generate text using messages approach
    const { text: article } = await generateText({
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
    const response: Step05WriteArticleAIResponse = {
      article,
    };

    logger.logStepResponse(5, "Write Article", response);

    // Close the logger to ensure logs are flushed
    await logger.close();

    return NextResponse.json(response);
  } catch (error) {
    console.error("Step 05 - Write article failed:", error);

    const errorResponse: Step05WriteArticleAIResponse = {
      article: "",
    };

    return NextResponse.json(errorResponse, { status: 500 });
  }
}
