'use client'

import Link from 'next/link'

import { Button } from '@repo/ui'

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
        <main className='min-h-dvh flex items-center justify-center p-6'>
          <div className='max-w-md text-center flex flec-col gap-4'>
            <h1 className='text-2xl font-semibold text-balance'>
              Something went wrong
            </h1>
            <p className='text-muted-foreground text-pretty'>
              An unexpected error occurred. If the problem persists, it may be
              due to a temporary outage.
            </p>
            <div className='flex items-center justify-center gap-3 pt-2'>
              <Button onClick={reset} variant='outline'>
                Try again
              </Button>
              <Link
                href='/maintenance'
                className='inline-flex items-center rounded-md border px-3 py-2 text-sm hover:bg-accent'
              >
                Status
              </Link>
            </div>
            {process.env.NODE_ENV !== 'production' && error?.digest && (
              <p className='text-xs text-muted-foreground'>{error.digest}</p>
            )}
          </div>
        </main>
      </body>
    </html>
  )
}
