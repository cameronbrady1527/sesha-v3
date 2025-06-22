"use client";

/* ==========================================================================*/
// source.tsx — Source input form component
/* ==========================================================================*/
// Purpose: Form inputs for digest source information (source, accreditation, description, options)
// Sections: Imports, Component, Exports

/* ==========================================================================*/
// Imports
/* ==========================================================================*/

// React core ----------------------------------------------------------------
import React, { useEffect, useState } from "react";

// shadcn/ui components ------------------------------------------------------
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

// External Packages ---------------------------------------------------------
import { Info } from "lucide-react";

// Context -------------------------------------------------------------------
import { useDigest } from "./digest-context";
import { VerbatimCheckbox } from "./verbatim-checkbox";

/* ==========================================================================*/
// Main Component
/* ==========================================================================*/

function SourceInputs() {
  // Import the Digest Context ----
  const { sourceInput, setSourceInput, sourceUsage, setSourceUsage, canSubmitSource } = useDigest();

  // Loading state for API call ----
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* -------------------------- debug effect ------------------------------ */
  useEffect(() => {
    console.log("[Source ctx]", { sourceInput, sourceUsage });
  }, [sourceInput, sourceUsage]);

  /* ---------------------------- handlers -------------------------------- */
  const handleGetRawText = async () => {
    if (!sourceInput.trim()) return;
    
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/get-source-text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: sourceInput,
          options: {
            formats: ['markdown'],
            onlyMainContent: true,
          }
        }),
      });

      const result = await response.json();

      console.log("result", result);

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch content');
      }

      // The API now returns plain text directly
      const content = result.data || 'No content found';
      console.log("content", content);
      setSourceUsage("sourceText", content);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch raw text';
      setError(errorMessage);
      console.error('Error fetching raw text:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUsageField = (field: keyof typeof sourceUsage, val: string | boolean) => setSourceUsage(field, val);

  return (
    <div className="space-y-6 px-2">
      {/* Header --- */}
      <h2 className="text-lg font-semibold text-foreground">Source Information</h2>

      {/* First Row: Source Input and Get Raw Text Button --- */}
      <div className="flex gap-2">
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="source-input" className="text-sm font-medium">
              Input Source
            </Label>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-3 w-3 text-muted-foreground cursor-pointer" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Enter text content, file path, or URL link as your source</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <Input id="source-input" placeholder="Text / File / Link" className="w-full" value={sourceInput} onChange={(e) => setSourceInput(e.target.value)} />
        </div>
        <div className="flex items-end">
          <Button 
            className="disabled:opacity-50 disabled:cursor-default" 
            onClick={handleGetRawText} 
            disabled={!canSubmitSource || isLoading}
          >
            {isLoading ? 'Getting Text...' : 'Get Raw Text'}
          </Button>
        </div>
      </div>

      {/* Error display --- */}
      {error && (
        <div className="text-sm text-destructive bg-destructive/10 p-2 rounded">
          {error}
        </div>
      )}

      {/* Second Row: Source Description (Left) and Accreditation + Checkboxes (Right) --- */}
      <div className="flex gap-4">
        {/* Left: Source Description Textarea --- */}
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="source-description-input" className="text-sm font-medium">
              Source Description
            </Label>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-3 w-3 text-muted-foreground cursor-pointer" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Brief description of what this source contains or represents</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <Textarea id="source-description-input" placeholder="Enter description..." className="w-full resize-none min-h-[120px]" value={sourceUsage.description} onChange={(e) => handleUsageField("description", e.target.value)} />
        </div>

        {/* Right: Accreditation and Checkboxes --- */}
        <div className="flex-1 space-y-4">
          {/* Top Row: Accreditation --- */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="accreditation-input" className="text-sm font-medium">
                Accreditation
              </Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-3 w-3 text-muted-foreground cursor-pointer" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Credit or attribution for this source (e.g., author, publication)</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <Input id="accreditation-input" placeholder="Enter accreditation..." className="w-full" value={sourceUsage.accredit} onChange={(e) => handleUsageField("accredit", e.target.value)} />
          </div>

          {/* Bottom Row: Both Checkboxes --- */}
          <div className="space-y-4">
            {/* Use Verbatim Checkbox with Dialog --- */}
            <VerbatimCheckbox />

            {/* Primary Source Checkbox --- */}
            <div className="flex items-center space-x-2">
              <Checkbox className="cursor-pointer" id="primary-source" checked={sourceUsage.primary} onCheckedChange={(checked) => handleUsageField("primary", checked)} />
              <div className="flex items-center gap-2">
                <Label htmlFor="primary-source" className="text-sm font-medium cursor-pointer">
                  Primary Source
                </Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3 w-3 text-muted-foreground cursor-pointer" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Mark this as the main or most important source for the digest</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ==========================================================================*/
// Public Component Exports
/* ==========================================================================*/

export { SourceInputs };
