'use client'

import { Button } from '@repo/ui'

import Logo from '@/components/general/logo'
import PageLayout from '@/components/layout/page-layout'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html>
      <body>
        <main className='min-h-dvh flex flex-col items-center justify-center p-6'>
          {/* <Logo className='mx-auto' /> */}
          <PageLayout>
            <div className='prose'>
              <h1 className='text-2xl text-center font-semibold text-balance'>
                Well, this is embarassing...
              </h1>
              <Logo className='mx-auto' />
              <p className='text-muted-foreground text-balance text-center'>
                An unexpected error occurred. If the problem persists, it may be
                due to a temporary outage. We appologize for the inconvenience.
              </p>
              <div className='flex items-center justify-center gap-3 pt-4'>
                <Button onClick={reset} variant='outline'>
                  Try again
                </Button>
                {/* <Link
                href='/maintenance'
                className='inline-flex items-center rounded-md border px-3 py-2 text-sm hover:bg-accent'
                >
                Status
                </Link> */}
              </div>
              {process.env.NODE_ENV !== 'production' && error?.digest ? (
                <p className='text-xs text-center text-muted-foreground mt-8'>
                  {error.digest}
                </p>
              ) : null}
            </div>
          </PageLayout>
        </main>
      </body>
    </html>
  )
}
