import { redirect } from 'next/navigation';

import { AppShell } from '@/components/layout/app-shell';
import { getCurrentProfile } from '@/lib/auth/profile';

/**
 * Guard-by-default layout for every authenticated route inside /(app).
 *
 * Middleware already redirects anonymous requests, but we double-check here
 * because (a) middleware can be bypassed by static prerender edge-cases, and
 * (b) Server Components downstream rely on a non-null user. We also fetch the
 * profile row once so child layouts/pages can read `papel` without an extra
 * round trip (the `getCurrentProfile` helper is request-cached).
 */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentProfile();

  if (!profile) {
    redirect('/login');
  }

  return (
    <AppShell user={{ id: profile.id, email: profile.email, papel: profile.papel }}>
      {children}
    </AppShell>
  );
}
