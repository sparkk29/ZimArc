import { createBrowserClient } from "@supabase/ssr";

// Creates a browser client that manages auth session via cookies.
export function createSupabaseBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // During `next build` (prerender), env vars might be missing in this environment.
  // Returning null lets the app compile/prerender; at runtime the user can provide env vars.
  if (!url || !anonKey) return null;

  return createBrowserClient(url, anonKey);
}

