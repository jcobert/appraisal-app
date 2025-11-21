import { Metadata } from 'next'
import { FC } from 'react'

import { protectPage } from '@/lib/db/utils'

import { buildPageTitle } from '@/configuration/seo'
import Dashboard from '@/features/dashboard/dashboard'

export const metadata: Metadata = {
  title: buildPageTitle('Dashboard'),
}

const Page: FC = async () => {
  await protectPage()

  return <Dashboard />
}

export default Page
