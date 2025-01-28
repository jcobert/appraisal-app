import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server'
import { FC } from 'react'

import { getUserProfile } from '@/lib/db/operations/user'

import UserProfilePage from '@/components/features/user/user-profile-page'
import PageLayout from '@/components/layout/page-layout'

import { PageParams } from '@/types/general'

type Props = PageParams

const Page: FC<Props> = async () => {
  const session = getKindeServerSession()
  const user = await session.getUser()

  const userProfile = await getUserProfile({ where: { accountId: user?.id } })

  return (
    <PageLayout>
      <UserProfilePage sessionUser={user} userProfile={userProfile} />
    </PageLayout>
  )
}

export default Page
