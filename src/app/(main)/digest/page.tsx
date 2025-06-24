/* ==========================================================================*/
// page.tsx — Digest page layout with resizable panels
/* ==========================================================================*/
// Purpose: Show digest builder.  If ?slug=&version= are provided we pre-fill the
//          context with that article's data; otherwise the builder is blank.
// Sections: Imports ▸ Utility Functions ▸ Data fetch ▸ Component ▸ Exports
/* ==========================================================================*/

/* ==========================================================================*/
// Imports
/* ==========================================================================*/

// React Server Component -----------------------------------------------------
import React from "react";

// DAL helpers ----------------------------------------------------------------
import { getArticleByOrgSlugVersion, getOrgPresets } from "@/db/dal";
import type { Article } from "@/db/schema";

// Digest UI (all client components) -----------------------------------------
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { BasicDigestInputs } from "@/components/digest/basic";
import { SourceInputs } from "@/components/digest/source";
import { TextFromSource } from "@/components/digest/text-from-source";
import { PresetsManager } from "@/components/digest/presets";

// Context --------------------------------------------------------------------
import { DigestProvider, type DigestState } from "@/components/digest/digest-context";

/* ==========================================================================*/
// Utility Functions
/* ==========================================================================*/

/**
 * buildInitialStateFromInputs
 * 
 * Converts ArticleInputs from the database into DigestState format
 * for pre-filling the digest form.
 * 
 * @param inputs - The article inputs from the database
 * @param articleId - The ID of the article being edited (if any)
 * @param currentVersion - The current version of the article
 * @param orgId - Organization ID
 * @returns Partial DigestState for context initialization
 */
function buildInitialStateFromInputs(
  inputs: Article, 
  orgId: number = 1,
  currentVersion: number = 1
): Partial<DigestState> {
  return {
    basic: {
      slug: inputs.slug,
      headline: ""
    },
    sourceUsage: {
      sourceText: inputs.inputSourceText,
      description: inputs.inputSourceDescription,
      accredit: inputs.inputSourceAccredit,
      verbatim: inputs.inputSourceVerbatim ,
      primary: inputs.inputSourcePrimary,
    },
    preset: {
      title: inputs.inputPresetTitle ?? "",
      instructions: inputs.inputPresetInstructions,
      blobs: inputs.inputPresetBlobs,
      length: inputs.inputPresetLength,
    },
    metadata: {
      orgId,
      currentVersion,
    },
  };
}

/* ==========================================================================*/
// Main Component  
/* ==========================================================================*/

/**
 * DigestPage
 *
 * Main digest page with resizable left panel for input forms and right panel for presets manager.
 * Uses 70/30 split with user-adjustable resize handle.
 */
async function DigestPage({ 
  searchParams 
}: { 
  searchParams: Promise<{ slug?: string; version?: string }> 
}) {
  /* ------------------------- 1. Parse URL params ----------------------- */
  const { slug, version } = await searchParams;
  const ORG_ID = 1; // <-- replace w/ auth session later

  /* ------------------------- 2. Fetch presets (always) ------------------ */
  const presets = await getOrgPresets(ORG_ID);

  /* ------------------------- 3. Fetch article (optional) ---------------- */
  let initialState: Partial<DigestState> | undefined;

  if (slug) {
    try {
      // Get both article metadata and inputs
      const article = await getArticleByOrgSlugVersion(ORG_ID, slug, version ? Number(version) : 1);
      
      if (article) {
        initialState = buildInitialStateFromInputs(
          article, 
          ORG_ID,
          version ? Number(version) : 1
        );
      }
      // If no article found, initialState remains undefined (blank form)
    } catch (error) {
      console.error('Failed to fetch article, leaving blank form:', error);
      // Continue with blank form on error
    }
  }

  console.log("🔍 DigestPage version:", version ? Number(version) : 1);

  // For new articles, make sure we have the orgId in metadata
  if (!initialState) {
    initialState = {
      metadata: {
        orgId: ORG_ID,
        currentVersion: version ? Number(version) : 1,
      },
    };
  }

  console.log("🔍 DigestPage initialState:", initialState);

  /* ------------------------- 4. Render client tree --------------------- */
  return (
    <DigestProvider initialState={initialState}>
      <div className="h-[calc(100vh-4rem)] group-has-data-[collapsible=icon]/sidebar-wrapper:h-[calc(100vh-3rem)] transition-[height] ease-linear">
        <ResizablePanelGroup direction="horizontal" className="h-full">
          {/* Start of Left Panel --- */}
          <ResizablePanel defaultSize={65} minSize={60} maxSize={70} className="">
            <div className="h-full flex flex-col">
              <div className="flex-1 overflow-y-auto px-6 pt-6 space-y-12">
                <BasicDigestInputs />
                <SourceInputs />
                <TextFromSource />
              </div>
            </div>
          </ResizablePanel>
          {/* End of Left Panel ---- */}

          <ResizableHandle />

          {/* Start of Right Panel --- */}
          <ResizablePanel defaultSize={35} minSize={30} maxSize={40} className="max-h-full bg-secondary/30">
            <PresetsManager presets={presets} />
          </ResizablePanel>
          {/* End of Right Panel ---- */}
        </ResizablePanelGroup>
      </div>
    </DigestProvider>
  );
}

/* ==========================================================================*/
// Public Component Exports
/* ==========================================================================*/

export default DigestPage;
