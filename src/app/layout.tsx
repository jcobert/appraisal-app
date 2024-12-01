import { Metadata } from 'next'
import { ReactNode } from 'react'

import QueryProvider from '@/providers/query-provider'

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
    <html lang='en'>
      <body>
        <QueryProvider>
          <div className='flex flex-col min-h-dvh'>
            {/** @todo Header here */}
            <div className='grow'>{children}</div>
            {/** @todo Footer here */}
          </div>
        </QueryProvider>
      </body>
    </html>
  )
}
