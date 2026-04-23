'use client';

import { QueryClient, QueryClientProvider, isServer } from '@tanstack/react-query';
import { useState } from 'react';

/**
 * TanStack Query provider.
 *
 * On the server we create a fresh QueryClient per request; on the browser we
 * lazily create a singleton so client-side re-renders keep the cache. This is
 * the pattern recommended in the TanStack Query Next.js App Router guide and
 * matches the React cache semantics (no cross-user data leakage on the
 * server).
 */
function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
        gcTime: 5 * 60 * 1000,
        refetchOnWindowFocus: false,
        retry: 1,
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined = undefined;

function getQueryClient() {
  if (isServer) return makeQueryClient();
  if (!browserQueryClient) browserQueryClient = makeQueryClient();
  return browserQueryClient;
}

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [client] = useState(getQueryClient);
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
