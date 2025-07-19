import { redirect } from 'next/navigation'
import { FC } from 'react'

import { getUserProfile } from '@/lib/db/queries/user'
import { getUserIdentities } from '@/lib/kinde-management/queries'

import { getActiveUserAccount } from '@/utils/auth'

import Crumbs from '@/components/layout/app-nav/crumbs'

import { PageParams } from '@/types/general'

import UserProfilePage from '@/features/user/user-profile-page'

type Props = PageParams

const Page: FC<Props> = async () => {
  const user = await getActiveUserAccount()

  const userProfile = await getUserProfile({ where: { accountId: user?.id } })

  if (!userProfile) {
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
