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
import React, { useState } from "react";
import { useRouter } from "next/navigation";

// shadcn/ui components ---
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";

// External Packages -----
import { Info, Loader2 } from "lucide-react";
import { useDigest } from "./digest-context";

// Local Files ---------------------------------------------------------------
import { getAuthenticatedUserClient } from "@/lib/supabase/client";
import { executeDigestPipeline } from "@/actions/pipeline";

// Types ---------------------------------------------------------------------
import type { DigestRequest } from "@/types/digest";
import type { BlobsCount, LengthRange } from "@/db/schema";

/* ==========================================================================*/
// Helper Functions
/* ==========================================================================*/

/**
 * buildDigestRequest
 *
 * Build a DigestRequest from digest context data and user metadata.
 *
 * @param params - Object containing all digest form data
 * @returns Complete DigestRequest for pipeline processing
 */
async function buildDigestRequest(params: {
  slug: string;
  headline: string;
  sourceUsage: {
    description: string;
    accredit: string;
    sourceText: string;
    verbatim: boolean;
    primary: boolean;
  };
  instructions: {
    instructions: string;
  };
  preset: {
    title: string;
    blobs: string;
    length: string;
  };
  metadata: {
    currentVersion?: number;
    orgId: number;
  };
}): Promise<DigestRequest> {
  // Get authenticated user info
  const authUser = await getAuthenticatedUserClient();

  if (!authUser) {
    throw new Error("User not authenticated");
  }

  return {
    metadata: {
      userId: authUser.userId,
      orgId: params.metadata.orgId.toString(),
      currentVersion: params.metadata.currentVersion || null,
    },
    slug: params.slug,
    headline: params.headline,
    source: {
      description: params.sourceUsage.description,
      accredit: params.sourceUsage.accredit,
      sourceText: params.sourceUsage.sourceText,
      verbatim: params.sourceUsage.verbatim,
      primary: params.sourceUsage.primary,
    },
    instructions: {
      instructions: params.instructions.instructions,
      blobs: params.preset.blobs as BlobsCount,
      length: params.preset.length as LengthRange,
    },
  };
}

/* ==========================================================================*/
// Main Component
/* ==========================================================================*/

function BasicDigestInputs() {
  // Import the Digest Context ----
  const { basic, setBasic, preset, sourceUsage, metadata, canDigest } = useDigest();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleDigestClick = async () => {
    if (isLoading) return;

    setIsLoading(true);

    // Build request data synchronously first
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

    // Navigate immediately - don't await anything after this
    router.push(`/library`);

    const request = await buildDigestRequest(requestData);

    console.log("🚀 Starting digest pipeline...");
    const result = await executeDigestPipeline(request);

    if (result.success) {
      console.log("✅ Pipeline completed successfully:", result);
      toast.success("Digest completed successfully");
    } else {
      console.error("❌ Pipeline failed:", result);
      toast.error("Digest failed");
    }
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
