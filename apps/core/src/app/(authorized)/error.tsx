'use client'

import { useQueryClient } from '@tanstack/react-query'
import { AlertCircle, RefreshCw } from 'lucide-react'

/**
 * Error boundary for all authorized pages.
 * Catches runtime errors in page components and layouts.
 *
 * Note: This only catches client-side errors. Server errors in
 * Server Components are handled by FetchResponse pattern.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const queryClient = useQueryClient()

  const handleRetry = () => {
    // Invalidate all queries to force refetch
    queryClient.invalidateQueries()
    // Then reset the error boundary
    reset()
  }

  return (
    <div className='flex min-h-[400px] flex-col items-center justify-center gap-6 p-8'>
      <div className='flex flex-col items-center gap-4 text-center'>
        <div className='rounded-full bg-red-100 p-3'>
          <AlertCircle className='size-8 text-red-600' />
        </div>

        <div className='space-y-2'>
          <h2 className='text-2xl font-semibold'>Something went wrong</h2>
          <p className='text-muted-foreground max-w-md'>
            We encountered an unexpected error. Don&apos;t worry, your data is
            safe.
          </p>
          {error?.digest ? (
            <p className='text-xs text-muted-foreground'>
              Error ID: {error.digest}
            </p>
          ) : null}
        </div>

        <div className='flex gap-3'>
          <button
            onClick={handleRetry}
            className='inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90'
          >
            <RefreshCw className='mr-2 size-4' />
            Try Again
          </button>
          <button
            onClick={() => (window.location.href = '/')}
            className='inline-flex items-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent'
          >
            Go Home
          </button>
        </div>
      </div>
    </div>
  )
}
