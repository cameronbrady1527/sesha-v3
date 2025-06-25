
/* ==========================================================================*/
// use-digest-submission.ts — Custom hook for digest pipeline submission
/* ==========================================================================*/
// Purpose: Consolidate digest submission logic and prevent code duplication
// Sections: Imports, Types, Helper Functions, Hook, Exports

/* ==========================================================================*/
// Imports
/* ==========================================================================*/

// React core ---
import { useState } from "react";

// External Packages ---
import { toast } from "sonner";

// Local Files ---
import { getAuthenticatedUserClient } from "@/lib/supabase/client";
import { executeDigestPipeline } from "@/actions/pipeline";

// Types ---
import type { DigestRequest } from "@/types/digest";
import type { BlobsCount, LengthRange } from "@/db/schema";

/* ==========================================================================*/
// Types
/* ==========================================================================*/

interface DigestSubmissionParams {
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
}

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
async function buildDigestRequest(params: DigestSubmissionParams): Promise<DigestRequest> {
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
// Hook
/* ==========================================================================*/

/**
 * useDigestSubmission
 *
 * Custom hook that manages digest pipeline submission with loading state.
 * Consolidates the submission logic used in multiple digest components.
 *
 * @returns Object with handleSubmit function and loading state
 */
export function useDigestSubmission() {
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (params: DigestSubmissionParams) => {
    if (isLoading) return;

    setIsLoading(true);

    try {
      console.log("🚀 Starting digest pipeline...");
      
      const request = await buildDigestRequest(params);
      const result = await executeDigestPipeline(request);

      if (result.success) {
        console.log("✅ Pipeline completed successfully:", result);
        toast.success("Digest completed successfully");
      } else {
        console.error("❌ Pipeline failed:", result);
        toast.error("Digest failed");
      }
    } catch (error) {
      console.error("❌ Digest submission error:", error);
      toast.error("An error occurred during digest submission");
    } finally {
      setIsLoading(false);
    }
  };

  return {
    handleSubmit,
    isLoading,
  };
}

/* ==========================================================================*/
// Public Hook Exports
/* ==========================================================================*/

export type { DigestSubmissionParams }; 