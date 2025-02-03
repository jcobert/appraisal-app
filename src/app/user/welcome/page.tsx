import { FC } from 'react'

import { registerUserProfile } from '@/lib/db/queries/user'

import UserProfileForm from '@/components/features/user/user-profile-form'
import FullScreenLoader from '@/components/layout/full-screen-loader'
import PageLayout from '@/components/layout/page-layout'

import { PageParams } from '@/types/general'

type Props = PageParams

const Page: FC<Props> = async () => {
  const profile = await registerUserProfile()

  if (!profile) return <FullScreenLoader />

  return (
    <PageLayout heading='Welcome'>
      <div className='flex flex-col gap-6 md:gap-8'>
        <div className='flex flex-col gap-4'>
          <h2 className='font-medium max-md:text-center text-2xl text-brand-extra-dark'>
            Thanks for signing up!
          </h2>
          <div className='prose max-md:mx-auto'>
            <p className='text-pretty'>
              Please take a moment to complete your profile. You can always
              return to your profile and make changes at any time.
            </p>
          </div>
        </div>

        <div className='flex flex-col gap-2'>
          <h3 className='font-medium text-xl text-center'>My Profile</h3>
          <UserProfileForm initialData={profile} registration />
        </div>
      </div>
    </PageLayout>
  )
}

export default Page
