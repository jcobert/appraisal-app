'use client'

import { Button } from '@repo/ui'

import PageLayout from '@/components/layout/page-layout'

export default function Error({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <PageLayout
      mainClassName='h-screen flex flex-col items-center justify-center p-6'
      className='flex flex-col gap-6 items-center'
    >
      <div className='flex flex-col gap-2 text-center max-w-prose'>
        <h2 className='text-2xl font-semibold'>Something went wrong!</h2>
        <p className='text-muted-foreground'>
          {`We couldn't complete your registration. Please try again.`}
        </p>
      </div>
      <Button onClick={() => reset()}>Try again</Button>
    </PageLayout>
  )
}
