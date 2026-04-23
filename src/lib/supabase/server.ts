import 'server-only';

import { cookies } from 'next/headers';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cache } from 'react';

import { publicEnv } from '@/lib/env';
import type { Database } from '@/types/supabase';

/**
 * Supabase client for Server Components, Server Actions and Route Handlers.
 *
 * Wrapped with `React.cache` so multiple calls within the same request share
 * the same instance (per-request deduplication — rule `server-cache-react`).
 *
 * Attempting to `cookies.set` from a Server Component throws in Next.js; we
 * swallow that specific error so reads still work. Mutations must happen from
 * Server Actions or Route Handlers.
 */
export const createSupabaseServerClient = cache(async () => {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }: { name: string; value: string; options: CookieOptions }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // `set` is unavailable inside Server Components. Middleware is in
            // charge of refreshing the session cookie on every request, so
            // ignoring this error is safe.
          }
        },
      },
    },
  );
});

/**
 * Returns the current authenticated user (or null) for the running request.
 *
 * Uses `getUser()` which contacts Supabase Auth to validate the JWT (safer
 * than `getSession()` that only reads cookies). Cached per request, so calling
 * it from several Server Components in the same tree costs a single round
 * trip.
 */
export const getCurrentUser = cache(async () => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});
