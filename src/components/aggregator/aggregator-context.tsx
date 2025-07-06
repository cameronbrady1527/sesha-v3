"use client";

/* ==========================================================================*/
// aggregator-context.tsx — React context for Aggregator creation flows
/* ==========================================================================*/
// Purpose: Centralised store + helpers (useAggregator) for coordinating multi‑
//          step aggregator builder UI (basic info, preset form, sources workflow).
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
  sourceText: string; // actual text used for aggregation
  verbatim: boolean;
  primary: boolean;
}

interface SourceInput {
  id: string; // Unique identifier for stable React keys
  url: string; // URL entered by user – only needed for processing step
  usage: SourceUsageOptions;
}

interface BasicForm {
  slug: string;
  headline: string;
}

interface AggregatorMetadata {
  currentVersion?: number; // Present if editing existing article
  orgId: number; // Organization ID
}

interface AggregatorState {
  basic: BasicForm;
  preset: PresetForm;
  sources: SourceInput[]; // Up to 6 sources
  metadata: AggregatorMetadata;
}

/* ------------------------- Reducer Action shape ------------------------- */

type AggregatorAction = 
  | { type: "SET_BASIC"; field: keyof BasicForm; value: string } 
  | { type: "SET_PRESET"; field: keyof PresetForm; value: string | BlobsCount | LengthRange } 
  | { type: "SET_SOURCE_INPUT"; sourceIndex: number; value: string } 
  | { type: "SET_SOURCE_USAGE"; sourceIndex: number; field: keyof SourceUsageOptions; value: string | boolean }
  | { type: "ADD_SOURCE" }
  | { type: "REMOVE_SOURCE"; sourceIndex: number }
  | { type: "SET_METADATA"; field: keyof AggregatorMetadata; value: string | number | boolean }
  | { type: "RESET_ALL" };

/* ----------------------------- Hook output ----------------------------- */

interface AggregatorDispatch {
  setBasic: (field: keyof BasicForm, value: string) => void;
  setPreset: (field: keyof PresetForm, value: string | BlobsCount | LengthRange) => void;
  setSourceInput: (sourceIndex: number, value: string) => void;
  setSourceUsage: (sourceIndex: number, field: keyof SourceUsageOptions, value: string | boolean) => void;
  addSource: () => void;
  removeSource: (sourceIndex: number) => void;
  setMetadata: (field: keyof AggregatorMetadata, value: string | number | boolean) => void;
  resetAll: () => void;
}

interface AggregatorValidation {
  canSavePreset: boolean;
  canAggregate: boolean;
  canSubmitSources: boolean;
  hasMaxSources: boolean;
  canRemoveSource: boolean;
}

interface AggregatorContextValue extends AggregatorState, AggregatorDispatch, AggregatorValidation {}

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

const DEFAULT_SOURCE_INPUT: SourceInput = {
  id: "",
  url: "",
  usage: DEFAULT_SOURCE_USAGE,
};

const DEFAULT_BASIC: BasicForm = { slug: "", headline: "" };

const DEFAULT_METADATA: AggregatorMetadata = {
  orgId: 1, // Default org ID
};

const INITIAL_STATE: AggregatorState = {
  basic: DEFAULT_BASIC,
  preset: DEFAULT_PRESET,
  sources: [{ ...DEFAULT_SOURCE_INPUT, id: `source-${Date.now()}` }], // Start with one source
  metadata: DEFAULT_METADATA,
};

/* ==========================================================================*/
// Reducer
/* ==========================================================================*/

function aggregatorReducer(state: AggregatorState, action: AggregatorAction): AggregatorState {
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
      return {
        ...state,
        sources: state.sources.map((source, index) =>
          index === action.sourceIndex
            ? { ...source, url: action.value }
            : source
        ),
      };
    case "SET_SOURCE_USAGE":
      return {
        ...state,
        sources: state.sources.map((source, index) =>
          index === action.sourceIndex
            ? {
                ...source,
                usage: {
                  ...source.usage,
                  [action.field]: action.value as SourceUsageOptions[typeof action.field],
                },
              }
            : source
        ),
      };
    case "ADD_SOURCE":
      if (state.sources.length >= 6) return state; // Max 6 sources
      return {
        ...state,
        sources: [...state.sources, { ...DEFAULT_SOURCE_INPUT, id: `source-${Date.now()}-${Math.random().toString(36).substr(2, 9)}` }],
      };
    case "REMOVE_SOURCE":
      if (state.sources.length <= 1) return state; // Min 1 source
      return {
        ...state,
        sources: state.sources.filter((_, index) => index !== action.sourceIndex),
      };
    case "SET_METADATA":
      return {
        ...state,
        metadata: {
          ...state.metadata,
          [action.field]: action.value as AggregatorMetadata[typeof action.field],
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

const AggregatorContext = createContext<AggregatorContextValue | undefined>(undefined);

function AggregatorProvider({ children, initialState }: { children: ReactNode; initialState: Partial<AggregatorState> | undefined }) {

  const mergedState = initialState ? { ...INITIAL_STATE, ...initialState } : INITIAL_STATE;
  const [state, dispatch] = useReducer(aggregatorReducer, mergedState);

  /* ---------------------------- Dispatch API ---------------------------- */
  const setBasic: AggregatorDispatch["setBasic"] = (field, value) => dispatch({ type: "SET_BASIC", field, value });

  const setPreset: AggregatorDispatch["setPreset"] = (field, value) => dispatch({ type: "SET_PRESET", field, value });

  const setSourceInput: AggregatorDispatch["setSourceInput"] = (sourceIndex, value) => dispatch({ type: "SET_SOURCE_INPUT", sourceIndex, value });

  const setSourceUsage: AggregatorDispatch["setSourceUsage"] = (sourceIndex, field, value) => dispatch({ type: "SET_SOURCE_USAGE", sourceIndex, field, value });

  const addSource: AggregatorDispatch["addSource"] = () => dispatch({ type: "ADD_SOURCE" });

  const removeSource: AggregatorDispatch["removeSource"] = (sourceIndex) => dispatch({ type: "REMOVE_SOURCE", sourceIndex });

  const setMetadata: AggregatorDispatch["setMetadata"] = (field, value) => dispatch({ type: "SET_METADATA", field, value });

  const resetAll: AggregatorDispatch["resetAll"] = () => dispatch({ type: "RESET_ALL" });

  /* ------------------------------ Validation --------------------------- */
  const canSavePreset = state.preset.title.trim() !== "" && state.preset.instructions.trim() !== "";

  // Aggregation action requires slug + at least one source with non-empty sourceText
  const canAggregate = state.basic.slug.trim() !== "" && 
    state.sources.some(source => source.usage.sourceText.trim() !== "");

  const canSubmitSources = state.sources.every(source => source.url.trim() !== "");

  const hasMaxSources = state.sources.length >= 6;
  const canRemoveSource = state.sources.length > 1;

  /* --------------------------- Provided value --------------------------- */
  const value: AggregatorContextValue = {
    ...state,
    setBasic,
    setPreset,
    setSourceInput,
    setSourceUsage,
    addSource,
    removeSource,
    setMetadata,
    resetAll,
    canSavePreset,
    canAggregate,
    canSubmitSources,
    hasMaxSources,
    canRemoveSource,
  };

  return <AggregatorContext.Provider value={value}>{children}</AggregatorContext.Provider>;
}

/* ==========================================================================*/
// Hook
/* ==========================================================================*/

function useAggregator(): AggregatorContextValue {
  const ctx = useContext(AggregatorContext);
  if (!ctx) throw new Error("useAggregator must be used within <AggregatorProvider>");
  return ctx;
}

/* ==========================================================================*/
// Exports
/* ==========================================================================*/

export { AggregatorProvider, useAggregator };
export type { AggregatorState };
