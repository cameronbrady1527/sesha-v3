"use client";

/* ==========================================================================*/
// basic.tsx — Basic digest form component
/* ==========================================================================*/
// Purpose: Form inputs for basic digest information (slug, headline, instructions)
// Sections: Imports, Props, Component, Exports

/* ==========================================================================*/
// Imports
/* ==========================================================================*/

// React core ---
import React from "react";

// shadcn/ui components ---
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

// External Packages -----
import { Info, Loader2 } from "lucide-react";
import { useDigest } from "./digest-context";

// Local Files ---------------------------------------------------------------
import { useDigestSubmission } from "@/hooks/use-digest-submission";

/* ==========================================================================*/
// Main Component
/* ==========================================================================*/

function BasicDigestInputs() {
  // Import the Digest Context ----
  const { basic, setBasic, preset, sourceUsage, metadata, canDigest } = useDigest();
  
  // Use the custom digest submission hook ----
  const { handleSubmit, isLoading } = useDigestSubmission();

  const handleDigestClick = async () => {
    // Build request data
    const requestData = {
      slug: basic.slug,
      headline: basic.headline,
      sourceUsage: {
        description: sourceUsage.description,
        accredit: sourceUsage.accredit,
        sourceText: sourceUsage.sourceText,
        verbatim: sourceUsage.verbatim,
        primary: sourceUsage.primary,
      },
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
    await handleSubmit(requestData);
  };

  // Render the component ----
  return (
    <div className="space-y-4 px-2">
      {/* Header --- */}
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-foreground">Basic Digest Info</h2>
        <Button onClick={handleDigestClick} disabled={!canDigest || isLoading} className="bg-blue-500 hover:bg-blue-600">
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            "Go"
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
                  A unique, URL-friendly identifier for this digest
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
              <p>The main title that will appear at the top of your digest</p>
            </TooltipContent>
          </Tooltip>
        </div>
        <Input id="headline-input" value={basic.headline} onChange={(e) => setBasic("headline", e.target.value)} placeholder="Add a headline..." className="w-full" />
      </div>
    </div>
  );
}

/* ==========================================================================*/
// Public Component Exports
/* ==========================================================================*/

export { BasicDigestInputs };
