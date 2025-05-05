import { Metadata } from 'next'
import { FC } from 'react'

import { getUserOrganizations } from '@/lib/db/queries/organization'
import { getActiveUserProfile } from '@/lib/db/queries/user'

import { protectPage } from '@/utils/auth'

import { buildPageTitle } from '@/configuration/seo'
import Dashboard from '@/features/dashboard/dashboard'

export const metadata: Metadata = {
  title: buildPageTitle('Dashboard'),
}

const Page: FC = async () => {
  await protectPage()

  const user = await getActiveUserProfile()
  const orgs = await getUserOrganizations()

  return <Dashboard user={user} organizations={orgs} />
}

export default Page
