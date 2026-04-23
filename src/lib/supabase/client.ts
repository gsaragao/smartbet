import { createBrowserClient } from '@supabase/ssr';

import { publicEnv } from '@/lib/env';
import type { Database } from '@/types/supabase';

/**
 * Supabase client for Client Components ("use client").
 *
 * `createBrowserClient` handles cookies through `document.cookie` automatically
 * and implements a singleton internally, so this function is safe to call from
 * multiple components without duplicating connections.
 *
 * Prefer Server Components + `createServerSupabaseClient` whenever possible to
 * avoid shipping data-fetching code to the browser (see vercel-react-best-
 * practices `server-serialization`).
 */
export function createSupabaseBrowserClient() {
  return createBrowserClient<Database>(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}
