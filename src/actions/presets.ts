/* ==========================================================================*/
// presets.ts — Server actions for preset management
/* ==========================================================================*/
// Purpose: Server actions for creating and updating digest presets
// Sections: Imports, Actions, Exports
/* ==========================================================================*/

"use server";

/* ==========================================================================*/
// Imports
/* ==========================================================================*/

// Next.js ---------------------------------------------------------------------
import { revalidatePath } from "next/cache";

// Shadcn ---------------------------------------------------------------------

// DAL helpers -----------------------------------------------------------------
import { createPreset, updatePreset } from "@/db/dal";
import type { BlobsCount, LengthRange } from "@/db/schema";

/* ==========================================================================*/
// Server Actions
/* ==========================================================================*/

/**
 * createPresetAction
 * 
 * Server action to create a new preset for an organization.
 * Revalidates the digest page after creation.
 * 
 * @param orgId - Organization ID
 * @param name - Preset name/title
 * @param instructions - Preset instructions
 * @param blobs - Number of blobs
 * @param length - Length range
 * @returns Success/error result with optional preset data
 */
export async function createPresetAction(
  orgId: number,
  name: string,
  instructions: string,
  blobs: BlobsCount,
  length: LengthRange
) {
  try {
    const preset = await createPreset({
      orgId,
      name,
      instructions,
      blobs,
      length,
    });

    // Revalidate digest page to show updated presets
    revalidatePath("/digest");


    return { success: true, preset };
  } catch (error) {
    console.error("Failed to create preset:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to create preset" 
    };
  }
}

/**
 * updatePresetAction
 * 
 * Server action to update an existing preset.
 * Revalidates the digest page after update.
 * 
 * @param presetId - Preset ID to update
 * @param name - Updated preset name/title
 * @param instructions - Updated preset instructions
 * @param blobs - Updated number of blobs
 * @param length - Updated length range
 * @returns Success/error result with optional preset data
 */
export async function updatePresetAction(
  presetId: string,
  name: string,
  instructions: string,
  blobs: BlobsCount,
  length: LengthRange
) {
  try {
    const preset = await updatePreset(presetId, {
      name,
      instructions,
      blobs,
      length,
    });

    if (!preset) {
      return { success: false, error: "Preset not found" };
    }

    // Revalidate digest page to show updated presets
    revalidatePath("/digest");

    return { success: true, preset };
  } catch (error) {
    console.error("Failed to update preset:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to update preset" 
    };
  }
}
