"use client";

/* ==========================================================================*/
// header-breadcrumbs.tsx — Dynamic breadcrumb navigation component
/* ==========================================================================*/
// Purpose: Renders breadcrumbs based on current pathname
// Sections: Imports, Helpers, Component, Exports

/* ==========================================================================*/
// Imports
/* ==========================================================================*/

// React core ---
import React from 'react';

// External Packages ---
import { usePathname } from 'next/navigation';

// Local Modules ---
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from '../ui/breadcrumb';

/* ==========================================================================*/
// Helper Functions
/* ==========================================================================*/

/**
 * getCurrentPage
 * 
 * Determines the current page name based on pathname
 * 
 * @param pathname - The current URL pathname
 * @returns The display name for the current page
 */
function getCurrentPage(pathname: string): string {
  if (pathname.includes("/library")) return "Library";
  if (pathname.includes("/dashboard")) return "Dashboard";
  if (pathname.includes("/digest")) return "Digest";
  if (pathname.includes("/article")) return "Article";
  return "Dashboard";
}

/* ==========================================================================*/
// Component
/* ==========================================================================*/

/**
 * HeaderBreadcrumbs
 *
 * Renders dynamic breadcrumb navigation based on current route
 */
function HeaderBreadcrumbs() {
  const pathname = usePathname();
  const currentPage = getCurrentPage(pathname);

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbPage className="text-sm font-medium">{currentPage}</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}

/* ==========================================================================*/
// Public Component Exports
/* ==========================================================================*/
export default HeaderBreadcrumbs;