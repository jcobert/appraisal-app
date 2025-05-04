'use client'

import {
  ThemeProvider as NextThemesProvider,
  ThemeProviderProps,
} from 'next-themes'
import { FC } from 'react'

const ThemeProvider: FC<ThemeProviderProps> = ({ children, ...props }) => {
  return (
    <NextThemesProvider
      attribute='class'
      enableSystem
      defaultTheme='system'
      disableTransitionOnChange
      {...props}
    >
      {children}
    </NextThemesProvider>
  )
}

export default ThemeProvider
