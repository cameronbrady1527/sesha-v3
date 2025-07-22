"use client";

/* ==========================================================================*/
// dashboard-client.tsx — Client component for dashboard run statistics
/* ==========================================================================*/
// Purpose: Handles filter state, data fetching, and rendering for the dashboard run statistics page.
// Sections: Imports, Types, Component, Exports
/* ==========================================================================*/

/* ==========================================================================*/
// Imports
/* ==========================================================================*/

// React core ---
import React from "react";

// Local Modules ---
import { getOrgSummariesAction, getOrgUsersAction, RunFilters } from "@/actions/dashboard";
import { DashboardFilters } from "./filters";
import { DashboardDataTable } from "./data-table";
import type { LengthRange } from "@/db/schema";

/* ==========================================================================*/
// Types
/* ==========================================================================*/

interface DashboardClientProps {
  orgName: string;
  orgId: number;
}

/* ==========================================================================*/
// Component
/* ==========================================================================*/

/**
 * DashboardClient
 *
 * Client component for the dashboard run statistics page. Manages filter state,
 * fetches run data and summary statistics, and renders the data table and filters.
 *
 * @param orgId - Organization ID
 * @param organizationName - Name of the organization
 */
export function DashboardClient({ orgName, orgId }: DashboardClientProps) {
  // ----------------------------- State -----------------------------------
  const [filters, setFilters] = React.useState<RunFilters>({ timeRange: "all" });
  const [pendingFilters, setPendingFilters] = React.useState<RunFilters>({ timeRange: "all" });
  const [summaries, setSummaries] = React.useState<any[]>([]); // TODO: Replace any with OrgSummary type
  const [users, setUsers] = React.useState<any[]>([]); // TODO: Replace any with User
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Fetch org users once on mount or when orgId changes
  React.useEffect(() => {
    async function fetchOrgUsers() {
      try {
        const orgUsers = await getOrgUsersAction(orgId);
        setUsers(orgUsers);
      } catch (err: any) {
        setError("Failed to load users for this organization.");
      }
    }
    fetchOrgUsers();
  }, [orgId]);

  // -------------------------- Data Fetching ------------------------------
  const fetchData = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch org summaries for the current org only
      const summariesData = await getOrgSummariesAction({ ...filters, orgId });
      setSummaries(summariesData);
    } catch (err) {
      setError("Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  }, [filters, orgId]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  // -------------------------- Filter Handlers ----------------------------
  function handleApplyFilters(appliedFilters: {
    timeRange?: RunFilters["timeRange"];
    userId?: string;
    length?: string;
    sourceType?: "single" | "multi";
  }) {
    const newFilters = {
      ...appliedFilters,
      length: appliedFilters.length as LengthRange | undefined,
    };
    setFilters(newFilters);
    setPendingFilters(newFilters); // sync UI with applied filters
  }

  // ----------------------------- Render ----------------------------------
  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="text-sm text-muted-foreground">Loading dashboard data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center py-8">
        <div className="text-sm text-destructive">{error}</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters Section --- */}
      <div className="mt-6">
        <DashboardFilters
          filters={pendingFilters}
          users={users}
          onChange={handleApplyFilters}
        />
      </div>
      {/* Organization Name --- */}
      {orgName && (
        <div className="text-sm font-medium text-muted-foreground mb-2">
          Organization: {orgName}
        </div>
      )}
      {/* Data Table Section --- */}
      <DashboardDataTable
        data={summaries}
        users={users}
      />
    </div>
  );
}
