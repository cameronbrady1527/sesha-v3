import { ArticleDataTable } from "@/components/library/data-table";
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

  const articles = await getOrgArticlesMetadataPaginated(user.orgId);
  const totalCount = await getOrgArticlesCount(user.orgId);

  return (
    <div className="w-full space-y-6 px-6">
      {/* End of Header ---- */}

      {/* Start of Data Interface --- */}
      <Suspense fallback={<LibraryLoadingSkeleton />}>
        <div className="space-y-4 pt-4">
          <ArticleDataTable articles={articles} totalCount={totalCount} />
        </div>
      </Suspense>

      {/* End of Data Interface ---- */}
    </div>
  );
}
