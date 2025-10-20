import { Metadata } from 'next'
import { ReactNode } from 'react'

import ThemeProvider from '@/providers/theme-provider'

import '@/styles/tailwind.css'

export const metadata: Metadata = {
  title: 'Appraisal App - Marketing Site',
  description: 'Marketing site for Appraisal App',
  robots: { index: true, follow: true },
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang='en' suppressHydrationWarning>
      <body>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}