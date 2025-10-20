// Use this for theme provider for the web app
'use client'

import { ThemeProvider as NextThemesProvider, type ThemeProviderProps } from 'next-themes'

export default function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}