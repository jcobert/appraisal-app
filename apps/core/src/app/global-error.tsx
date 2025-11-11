'use client'

import { Button } from '@repo/ui'

import Logo from '@/components/general/logo'
import PageLayout from '@/components/layout/page-layout'

const GlobalError = ({
  error,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) => {
  // const isDatabaseFailure =
  //   isFetchError(error) && error.code === FetchErrorCode.DATABASE_FAILURE

  // const isNetworkError =
  //   isFetchError(error) && error.code === FetchErrorCode.NETWORK_ERROR

  // Note: global-error.tsx is outside all providers (including React Query),
  // so we can't invalidate queries. Use full page reload instead.
  const handleRetry = () => {
    window.location.reload()
  }

  return (
    <html>
      <body>
        <PageLayout mainClassName='min-h-dvh flex flex-col items-center justify-center p-6'>
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
              <Button onClick={handleRetry} variant='outline'>
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
      </body>
    </html>
  )
}

export default GlobalError
