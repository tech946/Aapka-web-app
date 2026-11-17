// lib/supabase-browser.ts
import { createBrowserClient } from '@supabase/ssr';

/* Cookie-based Supabase client for client components, so the session is shared
   with route handlers and the proxy. Returns the same instance on every call. */
export function createBrowserSupabaseClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
