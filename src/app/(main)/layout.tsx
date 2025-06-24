/* ==========================================================================*/
// layout.tsx — Auth layout with centered container
/* ==========================================================================*/
// Purpose: Provides consistent layout wrapper for authentication pages
// Sections: Imports, Props, Component, Exports

/* ==========================================================================*/
// Imports
/* ==========================================================================*/
// React core ---
import React from "react";

// Shadcn UI ---
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";

// Local Modules ---
import { NavigationSidebar } from "@/components/layout/sidebar";
import HeaderBreadcrumbs from "@/components/layout/header-breadcrumbs";
import { getAuthenticatedUserServer } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Image from "next/image";

/* ==========================================================================*/
// Props Interface
/* ==========================================================================*/
interface MainLayoutProps {
  children: React.ReactNode;
}

/* ==========================================================================*/
// Component
/* ==========================================================================*/

/**
 * MainLayout
 *
 * Layout wrapper for authentication pages with centered container
 */
async function MainLayout({ children }: MainLayoutProps) {
  // Await params following new Next.js pattern

  const user = await getAuthenticatedUserServer();

  if (!user) {
    redirect("/login");
  }

  return (
    <SidebarProvider className="h-screen">
      {/* Start of Navigation Sidebar ---------------------------------------- */}
      <NavigationSidebar user={user} />
      {/* End of Navigation Sidebar ------------------------------------------ */}

      {/* Start of Sidebar Inset --------------------------------------------- */}
      <SidebarInset className="h-screen overflow-x-hidden">
        {/* Header Breadcrumbs ---------------------------------------------- */}
        <header className="flex h-16 shrink-0 justify-between items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 border-b">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
            <HeaderBreadcrumbs />
          </div>
          <Image src={"/seshalogowithtext.svg"} alt="logo" width={140} height={100} className="pr-8" />
        </header>
        {/* End of Header Breadcrumbs ---------------------------------------- */}
        <div className="">
          {/* Start of Main Content --------------------------------------------- */}
          {children}
          {/* End of Main Content ---------------------------------------------- */}
        </div>
      </SidebarInset>
      {/* End of Sidebar Inset ---------------------------------------------- */}
    </SidebarProvider>
  );
}

/* ==========================================================================*/
// Public Component Exports
/* ==========================================================================*/
export default MainLayout;
