'use client'

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
