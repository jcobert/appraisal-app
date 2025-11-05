import type { Metadata, NextPage } from 'next'

import { Button } from '@repo/ui'

import PageLayout from '@/components/layout/page-layout'

import { buildPageTitle } from '@/configuration/seo'

export const metadata: Metadata = {
  title: buildPageTitle('Maintenance'),
  robots: { index: false, follow: false },
}

const Page: NextPage = () => {
  return (
    <PageLayout>
      <div className='max-w-prose flex flex-col items-center justify-center text-center gap-4 mx-auto h-full'>
        <h1 className='text-2xl font-semibold text-balance'>
          Temporarily unavailable
        </h1>
        <p className='text-muted-foreground text-balance'>
          We’re performing maintenance or experiencing an outage. Please try
          again in a few minutes.
        </p>
        <div className='pt-2'>
          <Button asChild variant='outline'>
            <a href='/'>Retry</a>
          </Button>
        </div>
      </div>
    </PageLayout>
  )
}

export default Page
