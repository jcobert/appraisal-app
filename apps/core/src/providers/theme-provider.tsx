'use client'

import { Monitor, Moon, Palette, Sun } from 'lucide-react'
import {
  ThemeProvider as NextThemesProvider,
  ThemeProviderProps,
} from 'next-themes'
import { FC } from 'react'

export enum Theme {
  light = 'light',
  dark = 'dark',
  system = 'system',
}

/** Returns icon component that represents the provided `theme`. */
export const getThemeIcon = (theme: keyof typeof Theme) => {
  if (theme === 'system') return Monitor
  if (theme === 'dark') return Moon
  if (theme === 'light') return Sun
  return Palette
}

const ThemeProvider: FC<ThemeProviderProps> = ({ children, ...props }) => {
  return (
    <NextThemesProvider
      attribute='class'
      enableSystem
      defaultTheme={Theme.light}
      // disableTransitionOnChange
      {...props}
    >
      {children}
    </NextThemesProvider>
  )
}

export default ThemeProvider
