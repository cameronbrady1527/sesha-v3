/* ==========================================================================*/
// aggregate.ts — Content pipeline request/response types
/* ==========================================================================*/
// Purpose: Define TypeScript interfaces for aggregate pipeline requests and responses
// Sections: Imports, Request Types, Step Types, Response Types
/* ==========================================================================*/

/* ==========================================================================*/
// Imports
/* ==========================================================================*/

// Local Types ----
import type { BlobsCount, LengthRange } from "@/db/schema";

/* ==========================================================================*/
// Request Types
/* ==========================================================================*/

/** Metadata for aggregate pipeline requests */
export interface AggregateRequestMetadata {
  userId: string;
  orgId: string;
  currentVersion: number | null; // null if creating new article, number if creating new version
}

/** Complete aggregate request with all required data */
export interface AggregateRequest {
  metadata: AggregateRequestMetadata;
  slug: string;
  headline: string;
  sources: {
    description: string;
    accredit: string;
    sourceText: string;
    verbatim: boolean;
    primary: boolean;
  }[];
  instructions: {
    instructions: string;
    blobs: BlobsCount;
    length: LengthRange;
  };
}

/** Base step request interface (can use extended input with accumulated context) */
export interface StepRequest {
  input: AggregateRequest;
}

/** Base response interface for all pipeline steps */
export interface BaseStepResponse {
  articleId: string;
  stepNumber: number;
  success: boolean;
}

export interface PipelineResponse {
  success: boolean;
}
