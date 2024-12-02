import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server'
import { Metadata } from 'next'
import { FC } from 'react'

import PageLayout from '@/components/layout/page-layout'

import { buildPageTitle } from '@/configuration/seo'

export const metadata: Metadata = {
  title: buildPageTitle('Dashboard'),
}
const Page: FC = async () => {
  const { getUser } = getKindeServerSession()
  const user = await getUser()

  return <PageLayout></PageLayout>
}

export default Page
