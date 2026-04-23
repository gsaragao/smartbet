'use client';

import * as React from 'react';
import { ThemeProvider as NextThemesProvider, type ThemeProviderProps } from 'next-themes';

/**
 * Thin wrapper around next-themes. Centralising it makes it easy to swap
 * implementations later (e.g. system-aware palette tweaks) without touching
 * every consumer.
 */
export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
