"use client";

/* ==========================================================================*/
// presets.tsx — Unified preset management component
/* ==========================================================================*/
// Purpose: Centralised UI for selecting, editing, and saving article presets.
//          Works with both single-source (digest) and multi-source (aggregate) modes.
//          Simplified UX: selected presets can only be updated (title disabled),
//          new presets created via "New" or "Duplicate" actions.
// Sections: Imports, Types, Component, Exports
/* ==========================================================================*/

/* ==========================================================================*/
// Imports
/* ==========================================================================*/

// React core ----------------------------------------------------------------
import React, { useEffect, useState } from "react";

// Server actions ------------------------------------------------------------
import { createPresetAction, updatePresetAction } from "@/actions/presets";

// shadcn/ui components ------------------------------------------------------
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";

// Icons ---------------------------------------------------------------------
import { Info } from "lucide-react";

// Local modules -------------------------------------------------------------
import { Preset } from "@/db/schema";
import type { BlobsCount, LengthRange } from "@/db/schema";
import { useArticleHandler } from "./article-handler-context";

/* ==========================================================================*/
// Types and Interfaces
/* ==========================================================================*/

interface PresetsProps {
  presets: Preset[]; // fetched list from server
}

/* ==========================================================================*/
// Component
/* ==========================================================================*/

function PresetsManager({ presets = [] }: PresetsProps) {
  /* ------------------------ article handler context bindings ---------------------- */
  const { preset, setPreset, canSavePreset, mode } = useArticleHandler();

  /* ----------------------------- local state ----------------------------- */
  const [selectedId, setSelectedId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [saveError, setSaveError] = useState<string>("");

  const currentPreset = presets.find((p) => p.id === selectedId);

  /* --------------------------- helper functions ------------------------- */
  
  const clearError = () => setSaveError("");

  const resetForm = () => {
    setPreset("title", "");
    setPreset("instructions", "");
    setPreset("blobs", "4");
    setPreset("length", "700-850");
  };

  const loadPresetIntoForm = (preset: Preset) => {
    setPreset("title", preset.name);
    setPreset("instructions", preset.instructions);
    setPreset("blobs", preset.blobs as BlobsCount);
    setPreset("length", preset.length as LengthRange);
  };

  const hasChanges = (): boolean => {
    if (!currentPreset) return true; // New preset always has "changes"
    return (
      preset.title !== currentPreset.name ||
      preset.instructions !== currentPreset.instructions ||
      preset.blobs !== currentPreset.blobs ||
      preset.length !== currentPreset.length
    );
  };

  const willUpdateExisting = (): boolean => {
    return !!currentPreset && preset.title === currentPreset.name;
  };



  /* --------------------------- event handlers --------------------------- */

  const handlePresetSelect = (id: string) => {
    clearError();
    setSelectedId(id);
    const selected = presets.find((p) => p.id === id);
    if (selected) {
      loadPresetIntoForm(selected);
    }
  };

  const handleNewPreset = () => {
    clearError();
    setSelectedId("");
    resetForm();
  };



  const handleSave = async () => {
    if (!canSavePreset || isLoading) return;
    if (currentPreset && !hasChanges()) return; // No changes to save

    setIsLoading(true);
    clearError();

    try {
      const ORG_ID = 1; // TODO: replace with auth session
      const isUpdating = willUpdateExisting();

      let result;
      if (isUpdating) {
        // Update existing preset (name matches current selection)
        result = await updatePresetAction(
          selectedId,
          preset.title,
          preset.instructions,
          preset.blobs as BlobsCount,
          preset.length as LengthRange
        );
      } else {
        // Create new preset (new name or no selection)
        result = await createPresetAction(
          ORG_ID,
          preset.title,
          preset.instructions,
          preset.blobs as BlobsCount,
          preset.length as LengthRange
        );
      }

      if (result.success) {
        toast.success(`Preset ${isUpdating ? 'updated' : 'created'} successfully`);
        console.log(`Preset ${isUpdating ? 'updated' : 'created'} successfully:`, result.preset);
        // If we created a new preset, select it
        if (!isUpdating && result.preset) {
          setSelectedId(result.preset.id);
        }
      } else {
        toast.error("Failed to save preset");
        setSaveError(result.error || "Failed to save preset");
      }
    } catch (error) {
      console.error("Error saving preset:", error);
      toast.error("An unexpected error occurred while saving");
      setSaveError("An unexpected error occurred while saving");
    } finally {
      setIsLoading(false);
    }
  };

  /* ------------------------- debug logging effect ----------------------- */
  useEffect(() => {
    console.log(`[${mode === 'single' ? 'Digest' : 'Aggregate'} Preset ctx]`, preset);
  }, [preset, mode]);

  /* --------------------------- render helpers --------------------------- */
  const handleField = (field: keyof typeof preset, val: string) =>
    setPreset(field, val as BlobsCount & LengthRange & string);

  const isSaveDisabled = !canSavePreset || (currentPreset && !hasChanges()) || isLoading;

  /* -------------------------------- UI ---------------------------------- */

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto overflow-x-hidden space-y-4 pl-4 py-4 pr-6 @container">
        {/* Select Preset */}
        <div className="space-y-4">
          <Label className="text-sm font-medium">Select Preset</Label>
          <div className="space-y-2">
            {/* Dropdown Row */}
            <Select value={selectedId} onValueChange={handlePresetSelect}>
              <SelectTrigger id="preset-select" className="w-full">
                <SelectValue placeholder={presets.length > 0 ? "Choose a preset..." : "No presets available"} />
              </SelectTrigger>
              <SelectContent>
                {presets.length > 0 ? (
                  presets.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="no-presets" disabled>
                    No presets available
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
            
            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                onClick={handleNewPreset}
                className="disabled:opacity-50 disabled:cursor-default border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300"
              >
                New
              </Button>
              <Button
                onClick={handleSave}
                disabled={isSaveDisabled}
                className="disabled:opacity-50 disabled:cursor-default bg-green-600 hover:bg-green-700 text-white"
              >
                {isLoading 
                  ? "Saving..." 
                  : "Save"
                }
              </Button>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {saveError && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-2">
            {saveError}
          </div>
        )}

        {/* Preset Title */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="preset-title" className="text-sm font-medium">
              Preset Title
            </Label>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-3 w-3 text-muted-foreground cursor-pointer" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Keep the same name to update existing preset, or change the name to create a new preset.</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <Input
            id="preset-title"
            value={preset.title}
            onChange={(e) => handleField("title", e.target.value)}
            placeholder="Enter preset title..."
            className="w-full"
          />
        </div>

        {/* Blobs */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Blobs</Label>
          <div className="grid grid-cols-2 @max-3xs:grid-cols-1 @lg:grid-cols-3 gap-2">
            {["1", "2", "3", "4", "5", "6"].map((num) => (
              <Button
                key={num}
                variant={num === preset.blobs ? "default" : "outline"}
                size="sm"
                className="h-8"
                onClick={() => handleField("blobs", num)}
              >
                {num}
              </Button>
            ))}
          </div>
        </div>

        {/* Length */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Length</Label>
          <div className="grid grid-cols-2 @max-3xs:grid-cols-1 gap-2">
            {[
              "100-250",
              "400-550",
              "700-850",
              "1000-1200",
            ].map((len) => (
              <Button
                key={len}
                variant={len === preset.length ? "default" : "outline"}
                size="sm"
                className="h-8"
                onClick={() => handleField("length", len)}
              >
                {len}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ==========================================================================*/
// Exports
/* ==========================================================================*/

export { PresetsManager };
export type { PresetsProps }; 