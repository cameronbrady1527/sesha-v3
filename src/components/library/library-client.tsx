"use client";

/* ==========================================================================*/
// library-client.tsx — Client component wrapper for library with infinite scroll
/* ==========================================================================*/
// Purpose: Handles infinite scroll logic at page level for the library
// Sections: Imports, Types, Component, Exports

/* ==========================================================================*/
// Imports
/* ==========================================================================*/

// React core ---
import React from "react";

// External Packages ---
import { useInView } from "react-intersection-observer";

// Local Modules ---
import { ArticleDataTable } from "./data-table";
import { ArticleMetadata } from "@/db/dal";
import { loadArticlesAction } from "@/actions/article";

/* ==========================================================================*/
// Types
/* ==========================================================================*/

interface LibraryClientProps {
  initialArticles: ArticleMetadata[];
  totalCount: number;
}

/* ==========================================================================*/
// Component
/* ==========================================================================*/

/**
 * LibraryClient
 *
 * Client-side wrapper for the library that handles infinite scroll
 * at the page level using intersection observer.
 */
function LibraryClient({ initialArticles, totalCount }: LibraryClientProps) {
  /* -------------------------------- State -------------------------------- */
  const [articles, setArticles] = React.useState<ArticleMetadata[]>(initialArticles);
  const [isLoading, setIsLoading] = React.useState(false);
  const [hasMore, setHasMore] = React.useState(initialArticles.length < totalCount);

  /* ------------------------- Infinite Scroll Setup ---------------------- */
  const { ref: loadMoreRef, inView } = useInView({
    threshold: 0,
    rootMargin: '100px',
  });

  /* -------------------------- Load More Handler -------------------------- */
  const loadMoreArticles = React.useCallback(async () => {
    if (isLoading || !hasMore) return;

    setIsLoading(true);
    
    try {
      const result = await loadArticlesAction(articles.length, 50);
      
      if (result.success && result.articles.length > 0) {
        setArticles(prev => [...prev, ...result.articles]);
        setHasMore(articles.length + result.articles.length < result.totalCount);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error('Failed to load more articles:', error);
      setHasMore(false);
    } finally {
      setIsLoading(false);
    }
  }, [articles.length, isLoading, hasMore]);

  /* ------------------------ Refresh Handler ------------------------ */
  const refreshArticles = React.useCallback(async () => {
    try {
      const result = await loadArticlesAction(0, articles.length);
      
      if (result.success) {
        setArticles(result.articles);
        setHasMore(result.articles.length < result.totalCount);
      }
    } catch (error) {
      console.error('Failed to refresh articles:', error);
    }
  }, [articles.length]);

  /* ------------------------ Intersection Observer ------------------------ */
  React.useEffect(() => {
    if (inView && hasMore && !isLoading) {
      loadMoreArticles();
    }
  }, [inView, hasMore, isLoading, loadMoreArticles]);

  /* ----------------------------- Render ---------------------------------- */
  return (
    <>
      <ArticleDataTable 
        articles={articles} 
        isLoading={isLoading}
        onRefresh={refreshArticles}
      />
      
      {/* Infinite scroll trigger */}
      {hasMore && (
        <div 
          ref={loadMoreRef}
          className="flex justify-center py-8"
        >
          {isLoading ? (
            <div className="text-sm text-muted-foreground">Loading more articles...</div>
          ) : (
            <div className="text-sm text-muted-foreground">Scroll to load more</div>
          )}
        </div>
      )}
      
      {/* End of results indicator */}
      {!hasMore && articles.length > 0 && (
        <div className="flex justify-center py-8">
          <div className="text-sm text-muted-foreground">
            You&apos;ve reached the end of the articles
          </div>
        </div>
      )}
    </>
  );
}

/* ==========================================================================*/
// Exports
/* ==========================================================================*/

export { LibraryClient }; 