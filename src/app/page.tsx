import { Metadata } from 'next'
import { FC } from 'react'

import PageLayout from '@/components/layout/page-layout'

import { buildPageTitle } from '@/configuration/seo'

export const metadata: Metadata = {
  title: buildPageTitle('Home'),
}

const Page: FC = () => {
  return <PageLayout></PageLayout>
}

export default Page
