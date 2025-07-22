/* ==========================================================================*/
// page.tsx — Unified Digest page layout with resizable panels
/* ==========================================================================*/
// Purpose: Show digest builder using unified context and shared components.
//          If ?slug=&version= are provided we pre-fill the context with that 
//          article's data; otherwise the builder is blank.
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

// Shared UI Components -------------------------------------------------------
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { BasicArticleInputs } from "@/components/article-handling/shared/basic";
import { ArticleActions } from "@/components/article-handling/shared/actions";
import { SourceInputs } from "@/components/article-handling/shared/source";
import { PresetsManager } from "@/components/article-handling/shared/presets";

// Unified Context ------------------------------------------------------------
import { ArticleHandlerProvider, type ArticleHandlerState } from "@/components/article-handling/shared/article-handler-context";

/* ==========================================================================*/
// Utility Functions
/* ==========================================================================*/

/**
 * buildInitialStateFromInputs
 * 
 * Converts Article inputs from the database into ArticleHandlerState format
 * for pre-filling the digest form with a single source.
 * 
 * @param inputs - The article inputs from the database
 * @param orgId - Organization ID
 * @param currentVersion - The current version of the article
 * @returns Partial ArticleHandlerState for context initialization
 */
function buildInitialStateFromInputs(
  inputs: Article, 
  orgId: number = 1,
  currentVersion: number = 1
): Partial<ArticleHandlerState> {
  // Build single source from database fields
  const sources = [{
    id: `source-1-${Date.now()}`,
    url: "", // URL is not stored in DB, only used for processing
    usage: {
      sourceText: inputs.inputSourceText1,
      description: inputs.inputSourceDescription1,
      accredit: inputs.inputSourceAccredit1,
      verbatim: inputs.inputSourceVerbatim1,
      primary: inputs.inputSourcePrimary1,
      base: false, // Not used in single mode
    }
  }];

  return {
    basic: {
      slug: inputs.slug,
      headline: ""
    },
    sources,
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
    mode: 'single', // Always single mode for digest
  };
}

/* ==========================================================================*/
// Main Component  
/* ==========================================================================*/

/**
 * Digest2Page
 *
 * Unified digest page with resizable left panel for input forms and right panel for presets manager.
 * Uses shared components and unified context. 70/30 split with user-adjustable resize handle.
 */
async function Digest2Page({ 
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
  let initialState: Partial<ArticleHandlerState> | undefined;

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

  console.log("🔍 Digest2Page version:", version ? Number(version) : 1);

  // For new articles, make sure we have the orgId in metadata and set single mode
  if (!initialState) {
    initialState = {
      metadata: {
        orgId: ORG_ID,
        currentVersion: version ? Number(version) : 1,
      },
      mode: 'single',
    };
  } else {
    // Ensure mode is set to single even when loading existing article
    initialState.mode = 'single';
  }

  console.log("🔍 Digest2Page initialState:", initialState);

  /* ------------------------- 4. Render client tree --------------------- */
  return (
    <ArticleHandlerProvider initialMode="single" initialState={initialState}>
      <div className="h-[calc(100vh-4rem)] group-has-data-[collapsible=icon]/sidebar-wrapper:h-[calc(100vh-3rem)] transition-[height] ease-linear">
        <ResizablePanelGroup direction="horizontal" className="h-full">
          {/* Start of Left Panel --- */}
          <ResizablePanel defaultSize={65} minSize={60} maxSize={70} className="">
            <div className="h-full flex flex-col">
              <div className="flex-1 overflow-y-auto px-6 pt-6 space-y-12">
                <BasicArticleInputs />
                <SourceInputs />
                <ArticleActions />   
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
    </ArticleHandlerProvider>
  );
}

/* ==========================================================================*/
// Public Component Exports
/* ==========================================================================*/

export default Digest2Page;
