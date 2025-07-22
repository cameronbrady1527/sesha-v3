import { DashboardDataTable } from "@/components/dashboard/data-table";
import { getOrganization } from "@/db/dal";
import { getAuthenticatedUserServer } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import type { DashboardRowData } from "@/components/dashboard/columns";

// Simple loading skeleton for dashboard
function DashboardLoadingSkeleton() {
  return (
    <div className="w-full space-y-6 px-6">
      <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
      <div className="space-y-4">
        <div className="h-10 w-full bg-gray-200 rounded animate-pulse" />
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 w-full bg-gray-100 rounded animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}

export default async function DashboardPage() {
  const user = await getAuthenticatedUserServer();
  if (!user) {
    redirect("/login");
  }

  // const spendSummary = await getOrgSpendSummary(user.orgId);
  const organization = await getOrganization(user.orgId);

  // Transform data to match DashboardRowData interface
  const dashboardData: DashboardRowData[] = [
    {
      organizationName: organization?.name || "Unknown Organization",
      totalRuns: 0,
      totalCost: 0,
      averageCostPerRun: 0,
    },
  ];

  return (
    <div className="w-full space-y-6 px-6">

      {/* End of Header ---- */}

      {/* Start of Data Interface --- */}
      <Suspense fallback={<DashboardLoadingSkeleton />}>
        <div className="space-y-4 pt-4">
          <DashboardDataTable 
            data={dashboardData} 
            organizationName={organization?.name}
          />
        </div>
      </Suspense>
      {/* End of Data Interface ---- */}
    </div>
  );
}
