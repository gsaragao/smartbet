import 'server-only';

import { cache } from 'react';
import { notFound, redirect } from 'next/navigation';

import { createSupabaseServerClient, getCurrentUser } from '@/lib/supabase/server';
import type { Database } from '@/types/supabase';

export type Perfil = Database['public']['Tables']['perfis']['Row'];
export type Papel = Database['public']['Enums']['papel_usuario'];

/**
 * Fetches the authenticated user's profile row, or null when the user is not
 * signed in. Cached per request so every Server Component that calls this in
 * the same tree incurs a single round trip.
 */
export const getCurrentProfile = cache(async (): Promise<Perfil | null> => {
  const user = await getCurrentUser();
  if (!user) return null;

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('perfis')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  // If the profile row is missing (e.g. migration gap) we surface `null` rather
  // than throwing — the caller can decide what to do (typically redirect to
  // login).
  if (error) {
    console.error('[getCurrentProfile] failed:', error.message);
    return null;
  }
  return data;
});

/**
 * Hard guard for authenticated routes. Redirects unauthenticated users to
 * /login preserving the original path as `?next=`.
 */
export async function requireAuth(pathname?: string): Promise<Perfil> {
  const profile = await getCurrentProfile();
  if (!profile) {
    const target = pathname ? `/login?next=${encodeURIComponent(pathname)}` : '/login';
    redirect(target);
  }
  return profile;
}

/**
 * Hard guard for admin-only routes.
 *
 * Security posture: we deliberately return a 404 (via `notFound()`) instead of
 * a 403 to avoid leaking the existence of admin pages to regular users. The
 * real authorization line is still the Postgres RLS + `fn_eh_admin()` policies
 * — this is just UX sugar on top.
 */
export async function requireAdmin(): Promise<Perfil> {
  const profile = await requireAuth();
  if (profile.papel !== 'admin') notFound();
  return profile;
}
