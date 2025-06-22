import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getUser } from "@/db/dal";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // The `setAll` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
    },
  });
}

// ==========================================================================
// Server Authentication Utilities
// ==========================================================================

export async function getAuthenticatedUserServer() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (!user || error) {
    return null;
  }

  // Fetch the full user record from our database
  const dbUser = await getUser(user.id);
  return dbUser || null;
}



