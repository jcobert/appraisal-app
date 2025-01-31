import { Metadata } from 'next'
import { FC } from 'react'

import { getActiveUserProfile } from '@/lib/db/queries/user'

import Greeting from '@/components/auth/greeting'
import PageLayout from '@/components/layout/page-layout'

import { buildPageTitle } from '@/configuration/seo'

export const metadata: Metadata = {
  title: buildPageTitle('Dashboard'),
}

const Page: FC = async () => {
  const user = await getActiveUserProfile()

  return <PageLayout heading={<Greeting user={user} />}></PageLayout>
}

export default Page
