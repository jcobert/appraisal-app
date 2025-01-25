import { Metadata } from 'next'
import NextTopLoader from 'nextjs-toploader'
import { ReactNode } from 'react'
import { Toaster } from 'react-hot-toast'
import twConfig from 'tailwind.config'

import { AuthProvider } from '@/providers/auth-provider'
import QueryProvider from '@/providers/query-provider'

import Header from '@/components/layout/header/header'

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
      <html lang='en'>
        <body>
          <QueryProvider>
            <NextTopLoader color={twConfig.theme.extend.colors.brand} showSpinner={false} />
            <Toaster
              position='top-right'
              toastOptions={{ success: { duration: 4000 } }}
            />
            <div className='flex flex-col h-0 min-h-dvh'>
              <Header />
              <div className='grow h-full'>{children}</div>
              {/** @todo Footer here */}
            </div>
          </QueryProvider>
        </body>
      </html>
    </AuthProvider>
  )
}
