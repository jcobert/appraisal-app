import Link from 'next/link'
import { redirect } from 'next/navigation'
import { FC } from 'react'

import { PageParams } from '@repo/types'
import { Button } from '@repo/ui'

import { handleRegisterUser } from '@/lib/db/handlers/user-handlers'

import { FetchErrorCode } from '@/utils/fetch'

import Logo from '@/components/general/logo'

import { siteConfig } from '@/configuration/site'

export const dynamic = 'force-dynamic'

const Page: FC<PageParams> = async () => {
  const profile = await handleRegisterUser()

  if (profile?.error) {
    // Redirect to dashboard if profile already exists.
    if (profile.error.code === FetchErrorCode.DUPLICATE) {
      redirect('/dashboard')
    }

    // Throw error to trigger error boundary (allows retry)
    throw new Error(profile.error.message || 'Failed to create user profile.')
  }

  if (!profile?.data) {
    throw new Error('An unexpected error occurred.')
  }

  return (
    <div className='h-full flex items-center justify-center'>
      <div className='flex flex-col gap-8'>
        <div className='flex flex-col gap-4'>
          <Logo className='size-24 max-w-[25vw] flex-none self-center' />
          <h1 className='text-2xl text-balance text-center font-semibold'>{`Welcome to ${siteConfig.title}`}</h1>
        </div>
        <div className='flex items-center flex-col gap-8 rounded px-6 self-center w-full max-w-prose'>
          <div className='max-w-prose'>
            <p className='text-balance text-center text-lg'>
              Thanks for signing up!
              <br />
              Continue to your dashboard to get started.
            </p>
          </div>
          <Button asChild size='lg' className='text-lg'>
            <Link href='/dashboard'>Continue</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

export default Page
