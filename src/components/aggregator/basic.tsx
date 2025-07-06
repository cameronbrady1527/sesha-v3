"use client";

/* ==========================================================================*/
// basic.tsx — Basic aggregator form component
/* ==========================================================================*/
// Purpose: Form inputs for basic aggregator information (slug, headline, instructions)
// Sections: Imports, Props, Component, Exports

/* ==========================================================================*/
// Imports
/* ==========================================================================*/

// React core ---
import React, { useState } from "react";

// shadcn/ui components ---
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

// External Packages -----
import { Info, Loader2, Maximize2, Minimize2 } from "lucide-react";
import { useAggregator } from "./aggregator-context";

// Local Files ---------------------------------------------------------------
import { useDigestSubmission } from "@/hooks/use-digest-submission";

/* ==========================================================================*/
// Main Component
/* ==========================================================================*/

function BasicAggregatorInputs() {
  // Import the Aggregator Context ----
  const { basic, setBasic, preset, setPreset, sources, metadata, canAggregate } = useAggregator();
  
  // Use the custom digest submission hook ----
  const { handleSubmit, isLoading } = useDigestSubmission();
  
  // Local state for expandable textarea
  const [instructionsExpanded, setInstructionsExpanded] = useState(false);

  const handleInstructionsExpandToggle = () => setInstructionsExpanded((p) => !p);

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

  // Render the component ----
  return (
    <div className="space-y-6 px-2">
      {/* Header --- */}
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-foreground">Basic Aggregator Info</h2>
        <Button onClick={handleAggregateClick} disabled={!canAggregate || isLoading} className="bg-blue-500 hover:bg-blue-600">
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

      {/* Slug Input --- */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Label htmlFor="slug-input" className="text-sm font-medium">
            Slug <span className="text-xs text-red-600">required</span>
          </Label>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-3 w-3 text-muted-foreground cursor-pointer" />
            </TooltipTrigger>
            <TooltipContent>
              <div>
                <p>
                  A unique, URL-friendly identifier for this aggregator
                  (e.g., &quot;weekly-tech-news&quot;).
                </p>
                <p>
                  Spaces become hyphens, all letters are lowercase,
                  and only letters, numbers, and hyphens are allowed.
                </p>
              </div>
            </TooltipContent>
          </Tooltip>
        </div>
        <Input 
          id="slug-input" 
          value={basic.slug} 
          onChange={(e) => setBasic("slug", e.target.value)} 
          placeholder="Enter slug..." 
          className={`w-full ${!basic.slug.trim() ? 'border-red-500 focus:border-red-500' : ''}`}
        />
      </div>

      {/* Headline Input --- */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Label htmlFor="headline-input" className="text-sm font-medium">
            Headline <span className="text-xs text-muted-foreground">optional</span>
          </Label>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-3 w-3 text-muted-foreground cursor-pointer" />
            </TooltipTrigger>
            <TooltipContent>
              <p>The main title that will appear at the top of your aggregated content</p>
            </TooltipContent>
          </Tooltip>
        </div>
        <Input id="headline-input" value={basic.headline} onChange={(e) => setBasic("headline", e.target.value)} placeholder="Add a headline..." className="w-full" />
      </div>

      {/* Editor Instructions --- */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Label htmlFor="editor-instructions" className="text-sm font-medium">
            Editor Instructions <span className="text-xs text-muted-foreground">optional</span>
          </Label>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-3 w-3 text-muted-foreground cursor-pointer" />
            </TooltipTrigger>
            <TooltipContent>
              <p>Instructions for the AI to follow when creating your aggregator. This will save with other preset settings when you save a preset.</p>
            </TooltipContent>
          </Tooltip>
        </div>
        <div className="relative">
          <Textarea
            id="editor-instructions"
            value={preset.instructions}
            onChange={(e) => setPreset("instructions", e.target.value)}
            placeholder="Enter editor instructions..."
            className={`w-full resize-none transition-all duration-200 ${
              instructionsExpanded ? "min-h-fit" : "min-h-[120px] max-h-[120px]"
            }`}
            style={instructionsExpanded ? { height: 'auto', minHeight: '120px' } : {}}
          />
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleInstructionsExpandToggle} 
            className="absolute top-2 right-2 h-6 w-6 p-0 bg-muted/50 hover:bg-muted/80 transition-colors cursor-pointer"
          >
            {instructionsExpanded ? <Minimize2 className="h-3 w-3" /> : <Maximize2 className="h-3 w-3" />}
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ==========================================================================*/
// Public Component Exports
/* ==========================================================================*/

export { BasicAggregatorInputs }; 