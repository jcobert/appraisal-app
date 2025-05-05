import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server'
import { redirect } from 'next/navigation'
import { FC } from 'react'

import { getUserProfile } from '@/lib/db/queries/user'
import { getUserIdentities } from '@/lib/kinde-management/queries'

import { PageParams } from '@/types/general'

import UserProfilePage from '@/features/user/user-profile-page'

type Props = PageParams

const Page: FC<Props> = async () => {
  const session = getKindeServerSession()
  const user = await session.getUser()

  const userProfile = await getUserProfile({ where: { accountId: user?.id } })

  if (!userProfile) {
    redirect('/dashboard')
  }

  const identities = await getUserIdentities()

  return (
    <UserProfilePage
      sessionUser={user}
      userProfile={userProfile}
      identities={identities}
    />
  )
}

export default Page
