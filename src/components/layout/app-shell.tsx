'use client';

import * as React from 'react';

import { MobileNav } from '@/components/layout/mobile-nav';
import { Sidebar } from '@/components/layout/sidebar';
import { Topbar } from '@/components/layout/topbar';
import { UserProvider } from '@/components/providers/user-context';
import type { Papel } from '@/lib/auth/profile';

type AppShellProps = {
  user: { id: string; email: string; papel: Papel };
  children: React.ReactNode;
};

/**
 * The canonical authenticated shell. Anatomy:
 *
 *   ┌─────────────────────────────────────────┐
 *   │ (on mobile) Topbar with menu trigger    │
 *   ├────────────┬────────────────────────────┤
 *   │            │  Topbar (hidden mobile)    │
 *   │  Sidebar   ├────────────────────────────┤
 *   │ (lg+ only) │  <main> children           │
 *   │            │                            │
 *   └────────────┴────────────────────────────┘
 *
 * The shell owns only the chrome; page-level padding/containers live inside
 * each route so the surface can be full-bleed when needed (dashboards,
 * charts, tables).
 */
export function AppShell({ user, children }: AppShellProps) {
  const [mobileOpen, setMobileOpen] = React.useState(false);

  return (
    <div className="bg-background relative flex min-h-dvh w-full">
      {/* Ambient brand glow in the upper-left — reads as "light source" for
          the whole app. Extremely subtle; never competes with content. */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-10 opacity-60 brand-glow"
      />

      <Sidebar className="hidden lg:flex" papel={user.papel} />

      <MobileNav open={mobileOpen} onOpenChange={setMobileOpen} papel={user.papel} />

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar user={user} onMobileMenuToggle={() => setMobileOpen(true)} />
        <main className="flex-1">
          <UserProvider papel={user.papel}>{children}</UserProvider>
        </main>
      </div>
    </div>
  );
}
