import { Metadata } from 'next'
import { FC } from 'react'

import { getSessionData, protectPage } from '@/lib/db/utils'

import { buildPageTitle } from '@/configuration/seo'
import Dashboard from '@/features/dashboard/dashboard'

export const metadata: Metadata = {
  title: buildPageTitle('Dashboard'),
}

const Page: FC = async () => {
  await protectPage()

  const { organizations, profile } = await getSessionData()

  return <Dashboard user={profile} organizations={organizations} />
}

export default Page
