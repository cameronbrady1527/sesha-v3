import { createBrowserClient } from "@supabase/ssr";

/* ==========================================================================*/
// Client Authentication Utilities
/* ==========================================================================*/

/**
 * Creates a Supabase client for the browser
 * @returns A Supabase client instance
 */
export function createClient() {
  return createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
}

/* ==========================================================================*/
// User Authentication Utilities
/* ==========================================================================*/

/**
 * Gets the current authenticated user from Supabase on the client side
 * Returns null if no user is found or returns error based on parameter
 * @param options.redirectOnError If true, returns null on error. If false, returns error object
 * @returns The authenticated user object and userId, or error if redirectOnError is false
 */
export async function getAuthenticatedUserClient() {
  const supabase = createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return {
    user,
    userId: user.id,
  };
}
