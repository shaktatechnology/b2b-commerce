'use client';

import * as React from 'react';
import { ThemeProvider as NextThemesProvider } from 'next-themes';

export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  // Bypassing next-themes script tag error in Next 16/React 19 for now
  return <>{children}</>;
}
