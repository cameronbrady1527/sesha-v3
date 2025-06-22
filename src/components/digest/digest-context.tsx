"use client";

/* ==========================================================================*/
// digest-context.tsx — React context for Digest creation flows
/* ==========================================================================*/
// Purpose: Centralised store + helpers (useDigest) for coordinating multi‑
//          step digest builder UI (basic info, preset form, source workflow).
// Sections: Imports ▸ Types ▸ Defaults ▸ Reducer ▸ Context ▸ Provider ▸ Hook ▸ Exports
/* ==========================================================================*/

/* ==========================================================================*/
// Imports
/* ==========================================================================*/

import React, { createContext, useContext, useReducer, ReactNode } from "react";
import type { BlobsCount, LengthRange } from "@/db/schema";

/* ==========================================================================*/
// Types
/* ==========================================================================*/

interface PresetForm {
  title: string; // unique, non‑empty
  instructions: string;
  blobs: BlobsCount;
  length: LengthRange;
}

interface SourceUsageOptions {
  description: string;
  accredit: string;
  sourceText: string; // actual text used for digest
  verbatim: boolean;
  primary: boolean;
}

interface BasicForm {
  slug: string;
  headline: string;
}

interface DigestMetadata {
  currentVersion?: number; // Present if editing existing article
  orgId: number; // Organization ID
}

interface DigestState {
  basic: BasicForm;
  preset: PresetForm;
  sourceInput: string; // URL entered by user – only needed for processing step
  sourceUsage: SourceUsageOptions;
  metadata: DigestMetadata;
}

/* ------------------------- Reducer Action shape ------------------------- */

type DigestAction = 
  | { type: "SET_BASIC"; field: keyof BasicForm; value: string } 
  | { type: "SET_PRESET"; field: keyof PresetForm; value: string | BlobsCount | LengthRange } 
  | { type: "SET_SOURCE_INPUT"; value: string } 
  | { type: "SET_SOURCE_USAGE"; field: keyof SourceUsageOptions; value: string | boolean }
  | { type: "SET_METADATA"; field: keyof DigestMetadata; value: string | number | boolean }
  | { type: "RESET_ALL" };

/* ----------------------------- Hook output ----------------------------- */

interface DigestDispatch {
  setBasic: (field: keyof BasicForm, value: string) => void;
  setPreset: (field: keyof PresetForm, value: string | BlobsCount | LengthRange) => void;
  setSourceInput: (value: string) => void;
  setSourceUsage: (field: keyof SourceUsageOptions, value: string | boolean) => void;
  setMetadata: (field: keyof DigestMetadata, value: string | number | boolean) => void;
  resetAll: () => void;
}

interface DigestValidation {
  canSavePreset: boolean;
  canDigest: boolean;
  canSubmitSource: boolean;
}

interface DigestContextValue extends DigestState, DigestDispatch, DigestValidation {}

/* ==========================================================================*/
// Defaults
/* ==========================================================================*/

const DEFAULT_PRESET: PresetForm = {
  title: "",
  instructions: "",
  blobs: "4",
  length: "700-850",
};

const DEFAULT_SOURCE_USAGE: SourceUsageOptions = {
  description: "",
  accredit: "",
  sourceText: "",
  verbatim: false,
  primary: false,
};

const DEFAULT_BASIC: BasicForm = { slug: "", headline: "" };

const DEFAULT_METADATA: DigestMetadata = {
  orgId: 1, // Default org ID
};

const INITIAL_STATE: DigestState = {
  basic: DEFAULT_BASIC,
  preset: DEFAULT_PRESET,
  sourceInput: "", // URL field
  sourceUsage: DEFAULT_SOURCE_USAGE,
  metadata: DEFAULT_METADATA,
};

/* ==========================================================================*/
// Reducer
/* ==========================================================================*/

function digestReducer(state: DigestState, action: DigestAction): DigestState {
  switch (action.type) {
    case "SET_BASIC":
      return {
        ...state,
        basic: {
          ...state.basic,
          [action.field]: action.value as BasicForm[typeof action.field],
        },
      };
    case "SET_PRESET":
      return {
        ...state,
        preset: {
          ...state.preset,
          [action.field]: action.value as PresetForm[typeof action.field],
        },
      };
    case "SET_SOURCE_INPUT":
      return { ...state, sourceInput: action.value };
    case "SET_SOURCE_USAGE":
      return {
        ...state,
        sourceUsage: {
          ...state.sourceUsage,
          [action.field]: action.value as SourceUsageOptions[typeof action.field],
        },
      };
    case "SET_METADATA":
      return {
        ...state,
        metadata: {
          ...state.metadata,
          [action.field]: action.value as DigestMetadata[typeof action.field],
        },
      };
    case "RESET_ALL":
      return INITIAL_STATE;
    default:
      return state;
  }
}

/* ==========================================================================*/
// Context + Provider
/* ==========================================================================*/

const DigestContext = createContext<DigestContextValue | undefined>(undefined);

function DigestProvider({ children, initialState }: { children: ReactNode; initialState: Partial<DigestState> | undefined }) {

  const mergedState = initialState ? { ...INITIAL_STATE, ...initialState } : INITIAL_STATE;
  const [state, dispatch] = useReducer(digestReducer, mergedState);

  /* ---------------------------- Dispatch API ---------------------------- */
  const setBasic: DigestDispatch["setBasic"] = (field, value) => dispatch({ type: "SET_BASIC", field, value });

  const setPreset: DigestDispatch["setPreset"] = (field, value) => dispatch({ type: "SET_PRESET", field, value });

  const setSourceInput: DigestDispatch["setSourceInput"] = (value) => dispatch({ type: "SET_SOURCE_INPUT", value });

  const setSourceUsage: DigestDispatch["setSourceUsage"] = (field, value) => dispatch({ type: "SET_SOURCE_USAGE", field, value });

  const setMetadata: DigestDispatch["setMetadata"] = (field, value) => dispatch({ type: "SET_METADATA", field, value });

  const resetAll: DigestDispatch["resetAll"] = () => dispatch({ type: "RESET_ALL" });

  /* ------------------------------ Validation --------------------------- */
  const canSavePreset = state.preset.title.trim() !== "" && state.preset.instructions.trim() !== "";

  // Digest action requires slug + non-empty sourceText
  const canDigest = state.basic.slug.trim() !== "" && state.sourceUsage.sourceText.trim() !== "";

  const canSubmitSource = state.sourceInput.trim() !== "";

  /* --------------------------- Provided value --------------------------- */
  const value: DigestContextValue = {
    ...state,
    setBasic,
    setPreset,
    setSourceInput,
    setSourceUsage,
    setMetadata,
    resetAll,
    canSavePreset,
    canDigest,
    canSubmitSource,
  };

  return <DigestContext.Provider value={value}>{children}</DigestContext.Provider>;
}

/* ==========================================================================*/
// Hook
/* ==========================================================================*/

function useDigest(): DigestContextValue {
  const ctx = useContext(DigestContext);
  if (!ctx) throw new Error("useDigest must be used within <DigestProvider>");
  return ctx;
}

/* ==========================================================================*/
// Exports
/* ==========================================================================*/

export { DigestProvider, useDigest };
export type { DigestState };
