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
import { loadArticlesAction, checkArticleStatusAction } from "@/actions/article";

/* ==========================================================================*/
// Types
/* ==========================================================================*/

// Running statuses that need live polling
const RUNNING_STATUSES = ["10%", "25%", "50%", "75%", "90%"] as const;
type RunningStatus = typeof RUNNING_STATUSES[number];

// Helper function to check if status is a running status
function isRunningStatus(status: string): status is RunningStatus {
  return (RUNNING_STATUSES as readonly string[]).includes(status);
}

/* ==========================================================================*/
// Component
/* ==========================================================================*/

/**
 * LibraryClient
 *
 * Client-side wrapper for the library that handles all data loading
 * via server actions, including initial load and infinite scroll.
 * Also handles live refresh for articles with running statuses.
 */
function LibraryClient() {
  /* -------------------------------- State -------------------------------- */
  const [articles, setArticles] = React.useState<ArticleMetadata[]>([]);
  const [isLoading, setIsLoading] = React.useState(true); // Start with loading true for initial load
  const [isLoadingMore, setIsLoadingMore] = React.useState(false);
  const [hasMore, setHasMore] = React.useState(true);

  /* ------------------------- Infinite Scroll Setup ---------------------- */
  const { ref: loadMoreRef, inView } = useInView({
    threshold: 0,
    rootMargin: '100px',
  });

  /* -------------------------- Initial Load Handler ----------------------- */
  const loadInitialArticles = React.useCallback(async () => {
    setIsLoading(true);
    
    try {
      const result = await loadArticlesAction(0, 50);
      
      if (result.success) {
        setArticles(result.articles);
        setHasMore(result.articles.length < result.totalCount);
      } else {
        console.error('Failed to load initial articles:', result.error);
        setArticles([]);
        setHasMore(false);
      }
    } catch (error) {
      console.error('Failed to load initial articles:', error);
      setArticles([]);
      setHasMore(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /* -------------------------- Load More Handler -------------------------- */
  const loadMoreArticles = React.useCallback(async () => {
    if (isLoadingMore || !hasMore || isLoading) return;

    setIsLoadingMore(true);
    
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
      setIsLoadingMore(false);
    }
  }, [articles.length, isLoading, isLoadingMore, hasMore]);

  /* ------------------------ Refresh Handler ------------------------ */
//   const refreshArticles = React.useCallback(async () => {
//     try {
//       const result = await loadArticlesAction(0, articles.length || 50);
      
//       if (result.success) {
//         setArticles(result.articles);
//         setHasMore(result.articles.length < result.totalCount);
//       }
//     } catch (error) {
//       console.error('Failed to refresh articles:', error);
//     }
//   }, [articles.length]);

  /* ------------------------ Live Refresh Handler ------------------------ */
  const checkRunningArticles = React.useCallback(async () => {
    // Find articles with running statuses
    const runningArticles = articles.filter(article => 
      isRunningStatus(article.status)
    );

    if (runningArticles.length === 0) {
      return; // No articles to check
    }

    try {
      // Check status of all running articles in parallel
      const statusChecks = runningArticles.map(article =>
        checkArticleStatusAction(article.slug, article.version)
      );

      const results = await Promise.all(statusChecks);

      // Update articles that have changed status
      let hasUpdates = false;
      const updatedArticles = articles.map(article => {
        const checkIndex = runningArticles.findIndex(ra => 
          ra.slug === article.slug && ra.version === article.version
        );
        
        if (checkIndex !== -1) {
          const result = results[checkIndex];
          if (result.success && result.article) {
            // Check if status has changed
            if (result.article.status !== article.status) {
              hasUpdates = true;
              return {
                ...article,
                status: result.article.status,
                updatedAt: result.article.updatedAt,
                // Update headline if it has changed
                headline: result.article.headline || article.headline,
              };
            }
          }
        }
        return article;
      });

      if (hasUpdates) {
        console.log("📡 Live refresh: Updated article statuses");
        setArticles(updatedArticles);
      }
    } catch (error) {
      console.error('Failed to check running articles:', error);
    }
  }, [articles]);

  /* ------------------------ Initial Load Effect ----------------------- */
  React.useEffect(() => {
    loadInitialArticles();
  }, [loadInitialArticles]);

  /* ------------------------ Live Refresh Effect ----------------------- */
  React.useEffect(() => {
    // Don't start polling until initial load is complete
    if (isLoading) return;

    // Check if there are any articles with running statuses
    const hasRunningArticles = articles.some(article => 
      isRunningStatus(article.status)
    );

    if (!hasRunningArticles) {
      return; // No running articles to poll
    }

    console.log("📡 Starting live refresh for running articles");
    
    // Set up polling interval
    const pollInterval = setInterval(checkRunningArticles, 3000);

    // Cleanup function
    return () => {
      console.log("📡 Stopping live refresh");
      clearInterval(pollInterval);
    };
  }, [isLoading, articles, checkRunningArticles]);

  /* ------------------------ Intersection Observer ------------------------ */
  React.useEffect(() => {
    if (inView && hasMore && !isLoading && !isLoadingMore) {
      loadMoreArticles();
    }
  }, [inView, hasMore, isLoading, isLoadingMore, loadMoreArticles]);

  /* ----------------------------- Render ---------------------------------- */
  
  // Show loading skeleton while loading initial data
  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="text-sm text-muted-foreground">Loading articles...</div>
      </div>
    );
  }

  // Count running articles for debugging
  const runningCount = articles.filter(article => 
    isRunningStatus(article.status)
  ).length;

  return (
    <>
      {/* Live refresh indicator */}
      {runningCount > 0 && (
        <div className="mb-4 px-4 py-2 bg-blue-50 border border-blue-200 rounded-md">
          <div className="flex items-center gap-2 text-sm text-blue-700">
            <div className="animate-pulse w-2 h-2 bg-blue-500 rounded-full"></div>
            Live monitoring {runningCount} article{runningCount !== 1 ? 's' : ''} in progress
          </div>
        </div>
      )}

      <ArticleDataTable 
        articles={articles} 
        isLoading={isLoadingMore}
      />
      
      {/* Infinite scroll trigger */}
      {hasMore && (
        <div 
          ref={loadMoreRef}
          className="flex justify-center py-8"
        >
          {isLoadingMore ? (
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
      
      {/* No articles found */}
      {!hasMore && articles.length === 0 && !isLoading && (
        <div className="flex justify-center py-8">
          <div className="text-sm text-muted-foreground">
            No articles found
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