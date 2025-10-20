import { redirect } from 'next/navigation'
import { FC } from 'react'

import { PageParams } from '@repo/types'

import { handleGetActiveUserProfile } from '@/lib/db/handlers/user-handlers'
import { getUserIdentities } from '@/lib/kinde-management/queries'

import { getActiveUserAccount } from '@/utils/auth'

import Crumbs from '@/components/layout/app-nav/crumbs'

import UserProfilePage from '@/features/user/user-profile-page'

type Props = PageParams

const Page: FC<Props> = async () => {
  const user = await getActiveUserAccount()

  const userProfile = (await handleGetActiveUserProfile())?.data

  if (!user || !userProfile) {
    redirect('/dashboard')
  }

  const identities = await getUserIdentities()

  return (
    <>
      <Crumbs hidden />
      <UserProfilePage
        sessionUser={user}
        userProfile={userProfile}
        identities={identities}
      />
    </>
  )
}

export default Page
