import { FC } from 'react'

import { registerUserProfile } from '@/lib/db/queries/user'

import Link from '@/components/general/link'
import Logo from '@/components/general/logo'
import FullScreenLoader from '@/components/layout/full-screen-loader'
import Heading from '@/components/layout/heading'
import { Button } from '@/components/ui/button'

import { PageParams } from '@/types/general'

type Props = PageParams

const Page: FC<Props> = async () => {
  const profile = await registerUserProfile()

  if (!profile) return <FullScreenLoader />

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
