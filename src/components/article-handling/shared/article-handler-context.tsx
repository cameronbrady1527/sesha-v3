"use client";

/* ==========================================================================*/
// article-handler-context.tsx — Unified React context for article creation flows
/* ==========================================================================*/
// Purpose: Centralised store + helpers for coordinating article creation UI
//          supporting both single-source (digest) and multi-source (aggregate) modes
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
  sourceText: string; // actual text used for processing
  verbatim: boolean;
  primary: boolean;
  base: boolean; // Only applies to multi mode
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

interface ArticleMetadata {
  currentVersion?: number; // Present if editing existing article
  orgId: number; // Organization ID
}

interface ArticleHandlerState {
  basic: BasicForm;
  preset: PresetForm;
  sources: SourceInput[]; // Always array, single source = [oneSource]
  metadata: ArticleMetadata;
  mode: 'single' | 'multi'; // Determines behavior
}

/* ------------------------- Reducer Action shape ------------------------- */

type ArticleHandlerAction = 
  | { type: "SET_BASIC"; field: keyof BasicForm; value: string } 
  | { type: "SET_PRESET"; field: keyof PresetForm; value: string | BlobsCount | LengthRange } 
  | { type: "SET_SOURCE_URL"; sourceIndex: number; value: string } 
  | { type: "SET_SOURCE_USAGE"; sourceIndex: number; field: keyof SourceUsageOptions; value: string | boolean }
  | { type: "ADD_SOURCE" }
  | { type: "REMOVE_SOURCE"; sourceIndex: number }
  | { type: "SET_METADATA"; field: keyof ArticleMetadata; value: string | number | boolean }
  | { type: "SET_MODE"; mode: 'single' | 'multi' }
  | { type: "RESET_ALL" };

/* ----------------------------- Hook output ----------------------------- */

interface ArticleHandlerDispatch {
  setBasic: (field: keyof BasicForm, value: string) => void;
  setPreset: (field: keyof PresetForm, value: string | BlobsCount | LengthRange) => void;
  setSourceUrl: (sourceIndex: number, value: string) => void;
  setSourceUsage: (sourceIndex: number, field: keyof SourceUsageOptions, value: string | boolean) => void;
  addSource: () => void;
  removeSource: (sourceIndex: number) => void;
  setMetadata: (field: keyof ArticleMetadata, value: string | number | boolean) => void;
  setMode: (mode: 'single' | 'multi') => void;
  resetAll: () => void;
}

interface ArticleHandlerValidation {
  canSavePreset: boolean;
  canSubmit: boolean; // Replaces canDigest/canAggregate
  canSubmitSources: boolean;
  canAddSource: boolean; // Only true in multi mode
  canRemoveSource: boolean; // Only true in multi mode with >1 source
}

interface ArticleHandlerContextValue extends ArticleHandlerState, ArticleHandlerDispatch, ArticleHandlerValidation {}

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
  base: false,
};

const DEFAULT_SOURCE_INPUT: SourceInput = {
  id: "",
  url: "",
  usage: DEFAULT_SOURCE_USAGE,
};

const DEFAULT_BASIC: BasicForm = { slug: "", headline: "" };

const DEFAULT_METADATA: ArticleMetadata = {
  orgId: 1, // Default org ID
};

const createInitialState = (mode: 'single' | 'multi'): ArticleHandlerState => ({
  basic: DEFAULT_BASIC,
  preset: DEFAULT_PRESET,
  sources: [{ ...DEFAULT_SOURCE_INPUT, id: `source-${Date.now()}` }], // Start with one source
  metadata: DEFAULT_METADATA,
  mode,
});

/* ==========================================================================*/
// Reducer
/* ==========================================================================*/

function articleHandlerReducer(state: ArticleHandlerState, action: ArticleHandlerAction): ArticleHandlerState {
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
    case "SET_SOURCE_URL":
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
      // Only allow in multi mode
      if (state.mode === 'single' || state.sources.length >= 6) return state;
      return {
        ...state,
        sources: [...state.sources, { ...DEFAULT_SOURCE_INPUT, id: `source-${Date.now()}-${Math.random().toString(36).substr(2, 9)}` }],
      };
    case "REMOVE_SOURCE":
      // Only allow in multi mode with >1 source
      if (state.mode === 'single' || state.sources.length <= 1) return state;
      return {
        ...state,
        sources: state.sources.filter((_, index) => index !== action.sourceIndex),
      };
    case "SET_METADATA":
      return {
        ...state,
        metadata: {
          ...state.metadata,
          [action.field]: action.value as ArticleMetadata[typeof action.field],
        },
      };
    case "SET_MODE":
      return {
        ...state,
        mode: action.mode,
        // When switching to single mode, keep only first source
        sources: action.mode === 'single' ? [state.sources[0]] : state.sources,
      };
    case "RESET_ALL":
      return createInitialState(state.mode);
    default:
      return state;
  }
}

/* ==========================================================================*/
// Context + Provider
/* ==========================================================================*/

const ArticleHandlerContext = createContext<ArticleHandlerContextValue | undefined>(undefined);

interface ArticleHandlerProviderProps {
  children: ReactNode;
  initialMode?: 'single' | 'multi';
  initialState?: Partial<ArticleHandlerState>;
}

function ArticleHandlerProvider({ children, initialMode = 'single', initialState }: ArticleHandlerProviderProps) {
  const baseState = createInitialState(initialMode);
  const mergedState = initialState ? { ...baseState, ...initialState } : baseState;
  const [state, dispatch] = useReducer(articleHandlerReducer, mergedState);

  /* ---------------------------- Dispatch API ---------------------------- */
  const setBasic: ArticleHandlerDispatch["setBasic"] = (field, value) => dispatch({ type: "SET_BASIC", field, value });

  const setPreset: ArticleHandlerDispatch["setPreset"] = (field, value) => dispatch({ type: "SET_PRESET", field, value });

  const setSourceUrl: ArticleHandlerDispatch["setSourceUrl"] = (sourceIndex, value) => dispatch({ type: "SET_SOURCE_URL", sourceIndex, value });

  const setSourceUsage: ArticleHandlerDispatch["setSourceUsage"] = (sourceIndex, field, value) => dispatch({ type: "SET_SOURCE_USAGE", sourceIndex, field, value });

  const addSource: ArticleHandlerDispatch["addSource"] = () => dispatch({ type: "ADD_SOURCE" });

  const removeSource: ArticleHandlerDispatch["removeSource"] = (sourceIndex) => dispatch({ type: "REMOVE_SOURCE", sourceIndex });

  const setMetadata: ArticleHandlerDispatch["setMetadata"] = (field, value) => dispatch({ type: "SET_METADATA", field, value });

  const setMode: ArticleHandlerDispatch["setMode"] = (mode) => dispatch({ type: "SET_MODE", mode });

  const resetAll: ArticleHandlerDispatch["resetAll"] = () => dispatch({ type: "RESET_ALL" });

  /* ------------------------------ Validation --------------------------- */
  const canSavePreset = state.preset.title.trim() !== "" && state.preset.instructions.trim() !== "";

  // Submit action requires slug + at least one source with non-empty sourceText
  const canSubmit = state.basic.slug.trim() !== "" && 
    state.sources.some(source => source.usage.sourceText.trim() !== "");

  const canSubmitSources = state.sources.every(source => source.url.trim() !== "");

  const canAddSource = state.mode === 'multi' && state.sources.length < 6;
  const canRemoveSource = state.mode === 'multi' && state.sources.length > 1;

  /* --------------------------- Provided value --------------------------- */
  const value: ArticleHandlerContextValue = {
    ...state,
    setBasic,
    setPreset,
    setSourceUrl,
    setSourceUsage,
    addSource,
    removeSource,
    setMetadata,
    setMode,
    resetAll,
    canSavePreset,
    canSubmit,
    canSubmitSources,
    canAddSource,
    canRemoveSource,
  };

  return <ArticleHandlerContext.Provider value={value}>{children}</ArticleHandlerContext.Provider>;
}

/* ==========================================================================*/
// Hook
/* ==========================================================================*/

function useArticleHandler(): ArticleHandlerContextValue {
  const ctx = useContext(ArticleHandlerContext);
  if (!ctx) throw new Error("useArticleHandler must be used within <ArticleHandlerProvider>");
  return ctx;
}

/* ==========================================================================*/
// Exports
/* ==========================================================================*/

export { ArticleHandlerProvider, useArticleHandler };
export type { ArticleHandlerState, SourceInput, SourceUsageOptions }; 