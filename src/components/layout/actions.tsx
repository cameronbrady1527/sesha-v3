"use client";

/* ==========================================================================*/
// Imports
/* ==========================================================================*/

// React core ---
import * as React from "react";

// Lucide Icons ---
import { ChevronsUpDown, LogOut, UserPlus } from "lucide-react";

// Shadcn UI ---
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from "@/components/ui/sidebar";

// Supabase ---
import { User } from "@/db/schema";


// Actions ---
import { logout } from "@/actions/auth";

/* ==========================================================================*/
// Props Interface
/* ==========================================================================*/

interface NavigationActionsProps {
  user: User;
}

/* ==========================================================================*/
// Component
/* ==========================================================================*/

export function NavigationActions({ user }: NavigationActionsProps) {
  const { isMobile } = useSidebar();

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild className="cursor-pointer">
            <SidebarMenuButton size="lg" className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground">
              <div className="bg-blue-500 text-white flex aspect-square size-8 items-center justify-center rounded-lg">
                {/* <Command className="size-4" /> */}
                S
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{user.firstName || user.lastName ? `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() : "Sesha Systems"}</span>
                <span className="truncate text-xs">{user.role}</span>
              </div>
              <ChevronsUpDown className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg" align="start" side={isMobile ? "bottom" : "bottom"} sideOffset={4}>
            {user.role === 'admin' && (
              <DropdownMenuItem className="gap-2 p-2" onClick={() => window.location.href = `/register?orgId=${user.orgId}`}>
                <div className="flex size-6 items-center justify-center rounded-md border bg-transparent">
                  <UserPlus className="size-4" />
                </div>
                <div className="text-muted-foreground font-medium">Organization Invite</div>
              </DropdownMenuItem>
            )}
            <DropdownMenuItem className="gap-2 p-2" onClick={() => logout()}>
              <div className="flex size-6 items-center justify-center rounded-md border bg-transparent">
                <LogOut className="size-4" />
              </div>
              <div className="text-muted-foreground font-medium" >Logout</div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
