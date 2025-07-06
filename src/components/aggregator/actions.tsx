"use client";

/* ==========================================================================*/
// actions.tsx — Aggregator actions component
/* ==========================================================================*/
// Purpose: Action buttons for aggregator workflow (Add Source, Aggregate)
// Sections: Imports, Component, Exports

/* ==========================================================================*/
// Imports
/* ==========================================================================*/

// React core ---
import React from "react";

// shadcn/ui components ---
import { Button } from "@/components/ui/button";

// External Packages -----
import { Loader2, Plus } from "lucide-react";
import { useAggregator } from "./aggregator-context";

// Local Files ---------------------------------------------------------------
import { useDigestSubmission } from "@/hooks/use-digest-submission";

/* ==========================================================================*/
// Main Component
/* ==========================================================================*/

function AggregatorActions() {
  // Import the Aggregator Context ----
  const { basic, preset, sources, metadata, canAggregate, addSource, hasMaxSources } = useAggregator();
  
  // Use the custom digest submission hook ----
  const { handleSubmit, isLoading } = useDigestSubmission();

  const handleAggregateClick = async () => {
    // Build request data with multiple sources
    const requestData = {
      slug: basic.slug,
      headline: basic.headline,
      sources: sources.map((source, index) => ({
        sourceUsage: {
          description: source.usage.description,
          accredit: source.usage.accredit,
          sourceText: source.usage.sourceText,
          verbatim: source.usage.verbatim,
          primary: source.usage.primary,
        },
        sourceIndex: index + 1, // 1-based indexing for database
      })),
      instructions: {
        instructions: preset.instructions,
      },
      preset: {
        title: preset.title,
        blobs: preset.blobs,
        length: preset.length,
      },
      metadata: {
        currentVersion: metadata.currentVersion,
        orgId: metadata.orgId,
      },
    };

    // Submit using the hook
    // await handleSubmit(requestData);
  };

  const handleAddSource = () => {
    if (!hasMaxSources) {
      addSource();
    }
  };

  // Render the component ----
  return (
    <div className="flex justify-between items-center pb-6">
      <Button 
        onClick={handleAddSource} 
        disabled={hasMaxSources} 
        variant="outline"
        className="disabled:opacity-50 disabled:cursor-default"
      >
        <Plus className="mr-2 h-4 w-4" />
        Add Source ({sources.length}/6)
      </Button>
      
      <Button 
        onClick={handleAggregateClick} 
        disabled={!canAggregate || isLoading} 
        className="bg-blue-500 hover:bg-blue-600"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          "Aggregate"
        )}
      </Button>
    </div>
  );
}

/* ==========================================================================*/
// Public Component Exports
/* ==========================================================================*/

export { AggregatorActions }; 