"use client";

/* ==========================================================================*/
// article-context.tsx — React context for Article display and version management
/* ==========================================================================*/
// Purpose: Centralised store + helpers (useArticle) for coordinating article
//          display with version switching and article data management.
// Sections: Imports, Types, Context, Provider, Hook, Exports

/* ==========================================================================*/
// Imports
/* ==========================================================================*/

import React, { createContext, useContext, useState, ReactNode } from "react";
import { Article } from "@/db/schema";
import { ArticleVersionMetadata } from "@/db/dal";

/* ==========================================================================*/
// Types
/* ==========================================================================*/

// Extended article type with user information
type ArticleWithCreator = Article & { createdByName: string };

interface ArticleContextValue {
  // All article versions (full data with creator info)
  articles: ArticleWithCreator[];
  currentArticle: ArticleWithCreator | null;
  currentVersion: number;
  
  // Version metadata for sidebar (computed from articles)
  versionMetadata: ArticleVersionMetadata[];
  
  // Actions
  setCurrentVersion: (version: number) => void;
  updateCurrentArticle: (updates: Partial<Article>) => void;
  
  // Computed values
  slug: string;
  headline: string;
  lastModified: Date | null;
  createdByName: string;
  blobOutline: string;
  
  // Change tracking
  hasChanges: boolean;
  originalArticle: ArticleWithCreator | null;
  
  // Full current article for creating new versions
  getCurrentArticleForNewVersion: () => ArticleWithCreator | null;
}

/* ==========================================================================*/
// Context
/* ==========================================================================*/

const ArticleContext = createContext<ArticleContextValue | undefined>(undefined);

/* ==========================================================================*/
// Provider
/* ==========================================================================*/

interface ArticleProviderProps {
  children: ReactNode;
  articles: ArticleWithCreator[]; // Updated to use extended type
  initialVersion?: number;
}

/**
 * ArticleProvider
 *
 * Provides article data and version management state to child components.
 * Handles version switching and computed values like blob outline formatting.
 * Tracks changes to enable/disable save functionality.
 * Stores full Article objects for creating new versions.
 */
function ArticleProvider({ children, articles, initialVersion }: ArticleProviderProps) {
  // Debug logging
  console.log("🔍 ArticleProvider received articles:", articles.map(a => ({
    id: a.id,
    version: a.version,
    sentences: a.sentences,
    sentencesLength: a.sentences?.length,
    sentencesType: typeof a.sentences
  })));

  // Get the initial version (default to highest version if not specified)
  const defaultVersion = initialVersion || (articles.length > 0 ? Math.max(...articles.map(a => a.version)) : 1);
  const [currentVersion, setCurrentVersion] = useState(defaultVersion);
  
  // Track the current working copy and original for change detection
  const originalArticle = articles.find(article => article.version === currentVersion) || articles[0] || null;
  const [currentArticle, setCurrentArticle] = useState<ArticleWithCreator | null>(originalArticle);
  
  // Update current article when version changes
  React.useEffect(() => {
    const newArticle = articles.find(article => article.version === currentVersion) || articles[0] || null;
    setCurrentArticle(newArticle);
  }, [currentVersion, articles]);
  
  // Generate version metadata for the sidebar from full articles
  const versionMetadata: ArticleVersionMetadata[] = articles.map(article => ({
    version: article.version,
    slug: article.slug,
    headline: article.headline,
    createdAt: article.createdAt,
  }));
  
  // Update current article with changes
  const updateCurrentArticle = (updates: Partial<Article>) => {
    console.log("🔄 updateCurrentArticle called with:", updates);
    if (currentArticle) {
      const newArticle = { ...currentArticle, ...updates };
      console.log("📝 Setting new article:", {
        old: { headline: currentArticle.headline, blob: currentArticle.blob },
        new: { headline: newArticle.headline, blob: newArticle.blob }
      });
      setCurrentArticle(newArticle);
    }
  };
  
  // Get current article with all data for creating new versions
  const getCurrentArticleForNewVersion = (): ArticleWithCreator | null => {
    return currentArticle;
  };
  
  // Computed values
  const slug = currentArticle?.slug || '';
  const headline = currentArticle?.headline || '';
  const lastModified = currentArticle?.updatedAt || null;
  const createdByName = currentArticle?.createdByName || 'Unknown';
  
  // Format blob outline as dashed list
  const blobOutline = currentArticle?.blob 
    ? currentArticle.blob.split('\n').map(blob => `- ${blob}`).join('\n\n')
    : '';
  
  // Check if there are changes from the original
  const hasChanges = originalArticle && currentArticle ? (
    originalArticle.headline !== currentArticle.headline ||
    originalArticle.blob !== currentArticle.blob ||
    JSON.stringify(originalArticle.sentences) !== JSON.stringify(currentArticle.sentences) ||
    originalArticle.status !== currentArticle.status
  ) : false;
  
  console.log("🔍 Change detection:", {
    hasChanges,
    original: originalArticle ? { 
      headline: originalArticle.headline, 
      blob: originalArticle.blob,
      sentences: originalArticle.sentences,
      status: originalArticle.status
    } : null,
    current: currentArticle ? { 
      headline: currentArticle.headline, 
      blob: currentArticle.blob,
      sentences: currentArticle.sentences,
      status: currentArticle.status
    } : null
  });
  
  const value: ArticleContextValue = {
    articles,
    currentArticle,
    currentVersion,
    versionMetadata,
    setCurrentVersion,
    updateCurrentArticle,
    slug,
    headline,
    lastModified,
    createdByName,
    blobOutline,
    hasChanges,
    originalArticle,
    getCurrentArticleForNewVersion,
  };
  
  return (
    <ArticleContext.Provider value={value}>
      {children}
    </ArticleContext.Provider>
  );
}

/* ==========================================================================*/
// Hook
/* ==========================================================================*/

/**
 * useArticle
 *
 * Hook to access article context data and actions.
 * Must be used within an ArticleProvider.
 */
function useArticle(): ArticleContextValue {
  const context = useContext(ArticleContext);
  if (!context) {
    throw new Error('useArticle must be used within an ArticleProvider');
  }
  return context;
}

/* ==========================================================================*/
// Public Component Exports
/* ==========================================================================*/

export { ArticleProvider, useArticle };
export type { ArticleContextValue }; 