import { Metadata } from 'next'
import { ReactNode } from 'react'

import AuthProvider from '@/providers/auth-provider'
import ProgressProvider from '@/providers/progress-provider'
import QueryProvider from '@/providers/query-provider'
import ThemeProvider from '@/providers/theme-provider'

import ToasterOven from '@/components/toast/toast-container'

import { baseOpenGraph, baseTwitter } from '@/configuration/seo'
import { siteConfig } from '@/configuration/site'
import '@/styles/tailwind.css'

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: siteConfig.title,
  description: siteConfig.description,
  robots: { index: true, follow: true },
  // icons: {
  //   icon: '/favicon.ico',
  //   shortcut: '/favicon-16x16.png',
  //   apple: '/apple-icon.png',
  // },
  openGraph: { ...baseOpenGraph },
  twitter: { ...baseTwitter },
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <html lang='en' suppressHydrationWarning>
        <body>
          <QueryProvider>
            <ThemeProvider>
              <ProgressProvider />
              <ToasterOven />
              {children}
            </ThemeProvider>
          </QueryProvider>
        </body>
      </html>
    </AuthProvider>
  )
}
