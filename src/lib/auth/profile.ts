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

/**
 * Returns true when the role allows creating, editing and deleting data.
 * `admin` and `executor` are write-enabled; `consulta` is read-only.
 * `usuario` is kept for backward-compatibility (existing rows before the
 * 0029 migration ran).
 */
export function canWrite(papel: Papel): boolean {
  return papel === 'admin' || papel === 'executor' || papel === 'usuario';
}

/**
 * Hard guard for write operations (Server Actions that mutate data).
 *
 * Returns the profile when allowed. Returns an `ActionResult`-shaped object
 * with `ok: false` when the authenticated user has the `consulta` role, so
 * the caller can surface the error via toast without throwing.
 */
export async function requireExecutor(): Promise<Perfil | { ok: false; message: string }> {
  const profile = await requireAuth();
  if (!canWrite(profile.papel)) {
    return { ok: false, message: 'Você não tem permissão para esta ação.' };
  }
  return profile;
}
