/* ==========================================================================*/
// LibraryLoadingSkeleton.tsx — Loading skeleton for library page
/* ==========================================================================*/
// Purpose: Display loading skeleton while library data is being fetched
// Sections: Imports, Component, Exports

/* ==========================================================================*/
// Imports
/* ==========================================================================*/

// React core ---
import React from "react";

/* ==========================================================================*/
// Component
/* ==========================================================================*/

/**
 * LibraryLoadingSkeleton
 * 
 * Loading skeleton component for library page data table
 */
function LibraryLoadingSkeleton() {
  return (
    <div className="space-y-4">
      {/* Search/Filter Bar Skeleton */}
      <div className="flex items-center justify-between">
        <div className="h-9 w-64 bg-gray-200 rounded animate-pulse"></div>
        <div className="flex items-center gap-2">
          <div className="h-9 w-20 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-9 w-24 bg-gray-200 rounded animate-pulse"></div>
        </div>
      </div>

      {/* Table Header Skeleton */}
      <div className="border rounded-md">
        <div className="grid grid-cols-6 gap-4 p-4 border-b">
          <div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-4 w-12 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-4 w-14 bg-gray-200 rounded animate-pulse"></div>
        </div>

        {/* Table Rows Skeleton */}
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="grid grid-cols-6 gap-4 p-4 border-b last:border-b-0">
            <div className="h-4 w-full bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 w-full bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 w-12 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 w-full bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 w-14 bg-gray-200 rounded animate-pulse"></div>
          </div>
        ))}
      </div>

      {/* Pagination Skeleton */}
      <div className="flex items-center justify-between">
        <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
        </div>
      </div>
    </div>
  );
}

/* ==========================================================================*/
// Public Component Exports
/* ==========================================================================*/

export { LibraryLoadingSkeleton }; 