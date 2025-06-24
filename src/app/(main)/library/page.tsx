import { LibraryClient } from "@/components/library/library-client";
import { LibraryLoadingSkeleton } from "@/components/library/skeleton";
import { getAuthenticatedUserServer } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Suspense } from "react";

export default async function LibraryPage() {
  const user = await getAuthenticatedUserServer();
  if (!user) {
    redirect("/login");
  }

  return (
    <div className="w-full space-y-6 px-6">
      {/* End of Header ---- */}

      {/* Start of Data Interface --- */}
      <Suspense fallback={<LibraryLoadingSkeleton />}>
        <div className="space-y-4 pt-4">
          <LibraryClient />
        </div>
      </Suspense>

      {/* End of Data Interface ---- */}
    </div>
  );
}
