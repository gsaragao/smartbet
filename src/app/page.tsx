import { redirect } from 'next/navigation';

import { getCurrentUser } from '@/lib/supabase/server';

/**
 * The root route is a thin redirector: authenticated users jump straight into
 * the app, guests land on the sign-in page. Keeping this dynamic because the
 * auth decision depends on request cookies.
 */
export const dynamic = 'force-dynamic';

export default async function RootPage() {
  const user = await getCurrentUser();
  redirect(user ? '/dashboard' : '/login');
}
