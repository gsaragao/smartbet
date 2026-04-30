'use client';

import * as React from 'react';

// Type-only import — erased at build time, safe in client components even
// though profile.ts has `import 'server-only'`.
import type { Papel } from '@/lib/auth/profile';

type UserContextValue = {
  papel: Papel;
  /** True when the user's role allows creating, editing and deleting data. */
  canWrite: boolean;
};

/** Mirrors `canWrite()` from profile.ts — kept in sync manually. */
function isWriteRole(papel: Papel): boolean {
  return papel === 'admin' || papel === 'executor' || papel === 'usuario';
}

const UserContext = React.createContext<UserContextValue | null>(null);

export function UserProvider({
  papel,
  children,
}: {
  papel: Papel;
  children: React.ReactNode;
}) {
  const value = React.useMemo<UserContextValue>(
    () => ({ papel, canWrite: isWriteRole(papel) }),
    [papel],
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

/**
 * Returns the current user's role and write permission.
 * Must be called inside an `<AppShell>` (which wraps `<UserProvider>`).
 */
export function useUser(): UserContextValue {
  const ctx = React.useContext(UserContext);
  if (!ctx) {
    throw new Error('useUser must be used inside <UserProvider> (within <AppShell>)');
  }
  return ctx;
}
