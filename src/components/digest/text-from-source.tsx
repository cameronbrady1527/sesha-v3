"use client";

/* ==========================================================================*/
// text-from-source.tsx — Text area component tied to Digest context
/* ==========================================================================*/
// Purpose: Editable raw‑text area with word counter & digest / reset actions.
//          Reads & writes `sourceUsage.sourceText` in useDigest().
// Sections: Imports ▸ ResetDialog ▸ Component ▸ Exports
/* ==========================================================================*/

/* ==========================================================================*/
// Imports
/* ==========================================================================*/

// React core ----------------------------------------------------------------
import React, { useState, useEffect } from "react";

// shadcn/ui components ------------------------------------------------------
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

// Icons ---------------------------------------------------------------------
import { Info, Maximize2, Minimize2, Loader2 } from "lucide-react";

// Context -------------------------------------------------------------------
import { useDigest } from "./digest-context";

// Local Files ---------------------------------------------------------------
import { getAuthenticatedUserClient } from "@/lib/supabase/client";
import { executeDigestPipeline } from "@/actions/pipeline2";

// Types ---------------------------------------------------------------------
import type { DigestRequest } from "@/types/digest";
import type { BlobsCount, LengthRange } from "@/db/schema";

/* ==========================================================================*/
// Reset confirmation dialog (reusable tiny component)
/* ==========================================================================*/
interface ResetConfirmProps {
  onConfirm: () => void;
  children: React.ReactNode;
}
function ResetConfirmDialog({ onConfirm, children }: ResetConfirmProps) {
  const [open, setOpen] = useState(false);

  const handleConfirm = () => {
    onConfirm();
    setOpen(false);
  };

  const handleCancel = () => {
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Reset Form</DialogTitle>
          <DialogDescription>Are you sure you want to reset text and options? This action cannot be undone.</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleConfirm}>
            Reset
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
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

function TextFromSource() {
  const { basic, preset, sourceUsage, metadata, setSourceUsage, resetAll, canDigest } = useDigest();

  const [expanded, setExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  /* -------------------------- debug logging ---------------------------- */
  useEffect(() => {
    console.log("[SourceText]", sourceUsage.sourceText.slice(0, 50));
  }, [sourceUsage.sourceText]);

  /* ------------------------------ helpers ------------------------------ */
  const countWords = (txt: string) => (txt.trim() === "" ? 0 : txt.trim().split(/\s+/).length);
  const wordCount = countWords(sourceUsage.sourceText);
  const maxWords = 30_000;

  /* --------------------------- event handlers -------------------------- */
  const handleTextChange = (val: string) => setSourceUsage("sourceText", val);
  const handleExpandToggle = () => setExpanded((p) => !p);
  const handleReset = () => {
    resetAll();
  };

  /**
   * handlePaste
   *
   * Clean up pasted text by removing excessive newlines and normalizing paragraph breaks.
   *
   * @param event - Paste event from textarea
   */
  const handlePaste = (event: React.ClipboardEvent<HTMLTextAreaElement>) => {
    event.preventDefault();

    // Get the pasted text
    const pastedText = event.clipboardData.getData("text");

    // Clean up the text:
    // 1. Replace multiple consecutive newlines with double newlines (paragraph breaks)
    // 2. Trim whitespace from start and end
    const cleanedText = pastedText
      .replace(/\n{3,}/g, "\n\n") // Replace 3+ newlines with 2
      .replace(/\r\n/g, "\n") // Normalize Windows line endings
      .trim();

    // Get current cursor position
    const textarea = event.currentTarget;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    // Get current text value
    const currentText = sourceUsage.sourceText;

    // Insert cleaned text at cursor position
    const newText = currentText.substring(0, start) + cleanedText + currentText.substring(end);

    // Update the source text
    handleTextChange(newText);

    // Set cursor position after the pasted text
    setTimeout(() => {
      textarea.selectionStart = textarea.selectionEnd = start + cleanedText.length;
      textarea.focus();
    }, 0);
  };

  const handleDigestClick = async () => {
    if (isLoading) return;

    setIsLoading(true);
    try {
      const request = await buildDigestRequest({
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
      });

      console.log("🚀 Starting digest pipeline...");
      const result = await executeDigestPipeline(request);

      if (result.success) {
        console.log("✅ Pipeline completed successfully:", result);
        toast.success("Digest completed successfully");
      } else {
        console.error("❌ Pipeline failed:", result);
        toast.error("Digest failed");
      }
    } catch (error) {
      console.error("💥 Failed to execute digest pipeline:", error);
      toast.error("Failed to execute digest pipeline");
    } finally {
      setIsLoading(false);
    }
  };

  /* -------------------------------- UI --------------------------------- */
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Label className="text-lg font-semibold">Text from Source</Label>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-3 w-3 text-muted-foreground cursor-pointer" />
            </TooltipTrigger>
            <TooltipContent>
              <p>Raw text content extracted or pasted from your source.</p>
            </TooltipContent>
          </Tooltip>
        </div>
        <span className="text-sm text-muted-foreground">
          {wordCount.toLocaleString()}/{maxWords.toLocaleString()} words
        </span>
      </div>

      {/* Textarea */}
      <div className="relative">
        <Textarea id="source-text" value={sourceUsage.sourceText} onChange={(e) => handleTextChange(e.target.value)} onPaste={handlePaste} placeholder="Paste or enter source text here..." className={`w-full max-h-[500px] resize-none transition-all duration-200 ${expanded ? "min-h-[500px] max-h-[500px]" : "min-h-[300px] max-h-[300px]"}`} />
        <Button variant="ghost" size="sm" onClick={handleExpandToggle} className="absolute top-2 right-2 h-6 w-6 p-0 bg-muted/50 hover:bg-muted/80 transition-colors cursor-pointer">
          {expanded ? <Minimize2 className="h-3 w-3" /> : <Maximize2 className="h-3 w-3" />}
        </Button>
      </div>

      {/* Actions */}
      <div className="flex justify-between pb-6">
        <ResetConfirmDialog onConfirm={handleReset}>
          <Button variant="outline" disabled={isLoading}>
            Reset
          </Button>
        </ResetConfirmDialog>
        <Button onClick={handleDigestClick} disabled={!canDigest || isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            "Digest"
          )}
        </Button>
      </div>
    </div>
  );
}

/* ==========================================================================*/
// Exports
/* ==========================================================================*/

export { TextFromSource };
