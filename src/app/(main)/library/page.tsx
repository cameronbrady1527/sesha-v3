import { LibraryClient } from "@/components/library/library-client";
import { LibraryLoadingSkeleton } from "@/components/library/skeleton";
import { getOrgArticlesCount, getOrgArticlesMetadataPaginated } from "@/db/dal";
import { getAuthenticatedUserServer } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Suspense } from "react";

export default async function LibraryPage() {
  const user = await getAuthenticatedUserServer();
  if (!user) {
    redirect("/login");
  }

  // Load initial articles
  const initialArticles = await getOrgArticlesMetadataPaginated(user.orgId, 20, 0);
  const totalCount = await getOrgArticlesCount(user.orgId);

  return (
    <div className="w-full space-y-6 px-6">
      {/* End of Header ---- */}

      {/* Start of Data Interface --- */}
      <Suspense fallback={<LibraryLoadingSkeleton />}>
        <div className="space-y-4 pt-4">
          <LibraryClient 
            initialArticles={initialArticles} 
            totalCount={totalCount} 
          />
        </div>
      </Suspense>

      {/* End of Data Interface ---- */}
    </div>
  );
}
