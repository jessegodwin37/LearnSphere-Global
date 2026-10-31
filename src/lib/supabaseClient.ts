"use client";

import { createBrowserClient } from "@supabase/ssr";

/**
 * Browser Supabase client.
 * Uses the anon key — safe to ship. All authorisation happens in RLS.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}

let browserClient: ReturnType<typeof createClient> | null = null;

/** Singleton for client components — avoids a new client per render. */
export function getSupabaseBrowserClient() {
  if (!browserClient) browserClient = createClient();
  return browserClient;
}
