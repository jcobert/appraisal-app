import Link from 'next/link'
import { redirect } from 'next/navigation'
import { FC } from 'react'

import { PageParams } from '@repo/types'
import { Button } from '@repo/ui'

import { handleRegisterUser } from '@/lib/db/handlers/user-handlers'

import { FetchErrorCode } from '@/utils/fetch'

import Logo from '@/components/general/logo'
import FullScreenLoader from '@/components/layout/full-screen-loader'
import Heading from '@/components/layout/heading'

type Props = PageParams

const Page: FC<Props> = async () => {
  const profile = await handleRegisterUser()

  // Redirect to dashboard if profile already exists.
  if (profile?.error?.code === FetchErrorCode.DUPLICATE) {
    redirect('/dashboard')
  }

  /**
   * @todo
   * Currently treating no data as indicator that req is still in progress.
   * This isn't accurate though, as there could be no data due to error.
   * Implement a better strategy for showing loading UI and handling error (retry?).
   */
  if (!profile?.data) return <FullScreenLoader />

  return (
    <div>
      <Heading text='Welcome' />
      <div className='flex flex-col gap-6 md:gap-8 mt-8'>
        <Logo className='text-[25vw] h-fit max-w-48 self-center' />
        <div className='flex items-center flex-col gap-8 rounded p-6 self-center w-full max-w-prose'>
          <h2 className='text-balance max-md:text-center text-xl sm:text-2xl'>
            Thanks for signing up!
          </h2>
          {/* <p className='text-pretty'>sdfasdf</p> */}
          {/* <div className='prose max-md:mx-auto'>
            <p className='text-pretty'>
              Please take a moment to complete your profile. You can always
              return to your profile and make changes at any time.
            </p>
          </div> */}
          <Button asChild size='lg' className='text-lg'>
            <Link href='/dashboard'>Go to my dashboard</Link>
          </Button>
        </div>

        {/* <div className='flex flex-col gap-2'>
          <h3 className='font-medium text-xl text-center'>My Profile</h3>
          <UserProfileForm initialData={profile} registration />
        </div> */}
      </div>
    </div>
  )
}

export default Page
