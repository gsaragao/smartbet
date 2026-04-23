import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

import { publicEnv } from '@/lib/env';
import type { Database } from '@/types/supabase';

/**
 * Authenticated route prefixes (grouped under (app)).
 * Keep this in sync with the route groups under src/app/(app)/*.
 */
const PROTECTED_PREFIXES = [
  '/dashboard',
  '/bets',
  '/strategies',
  '/matches',
  '/banca',
  '/catalog',
  '/settings',
  '/projection',
  '/admin',
] as const;

/**
 * Routes that authenticated users should NOT see. If a logged-in user hits
 * /login or /register we redirect them to the dashboard.
 */
const GUEST_ONLY_PREFIXES = ['/login', '/register'] as const;

/**
 * Refreshes the Supabase session cookie on every request and enforces basic
 * route protection.
 *
 * Must be called from `middleware.ts`. Without this, Server Components cannot
 * reliably read the current user because tokens may have expired.
 */
export async function updateSession(request: NextRequest): Promise<NextResponse> {
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }: { name: string; value: string; options: CookieOptions }) => {
            request.cookies.set(name, value);
          });
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }: { name: string; value: string; options: CookieOptions }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  // IMPORTANT: call getUser() and NOT getSession() - getUser() validates the
  // JWT against Supabase Auth, getSession() only decodes the local cookie.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  const isGuestOnly = GUEST_ONLY_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  if (isProtected && !user) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }

  if (isGuestOnly && user) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    url.search = '';
    return NextResponse.redirect(url);
  }

  return response;
}
