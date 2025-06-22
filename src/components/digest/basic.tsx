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
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

// External Packages -----
import { Info } from "lucide-react";
import { useDigest } from "./digest-context";

/* ==========================================================================*/
// Main Component
/* ==========================================================================*/

function BasicDigestInputs() {
  // Import the Digest Context ----
  const { basic, setBasic } = useDigest();

  // Render the component ----
  return (
    <div className="space-y-4 px-2">
      {/* Header --- */}
      <h2 className="text-lg font-semibold text-foreground">Basic Digest Info</h2>

      {/* Slug Input --- */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Label htmlFor="slug-input" className="text-sm font-medium">
            Slug
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
        <Input id="slug-input" value={basic.slug} onChange={(e) => setBasic("slug", e.target.value)} placeholder="Enter slug..." className="w-full" />
      </div>

      {/* Headline Input --- */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Label htmlFor="headline-input" className="text-sm font-medium">
            Headline
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
