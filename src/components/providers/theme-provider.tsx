'use client';

import * as React from 'react';
import {
  ThemeProvider as TeispaceThemeProvider,
  type ThemeProviderProps,
} from '@teispace/next-themes';

/**
 * Tema global: `@teispace/next-themes` evita o aviso do React 19 com
 * `next-themes` (script inline na árvore client). Passe `initialTheme` a
 * partir de `getTheme()` no layout (RSC).
 */
export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <TeispaceThemeProvider {...props}>{children}</TeispaceThemeProvider>;
}
