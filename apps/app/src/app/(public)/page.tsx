import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { FC } from 'react'

import { isAuthenticated } from '@/utils/auth'

import PageLayout from '@/components/layout/page-layout'

import { buildPageTitle } from '@/configuration/seo'

export const metadata: Metadata = {
  title: buildPageTitle('Home'),
}

const Page: FC = async () => {
  const { allowed } = await isAuthenticated()
  if (allowed) {
    redirect('/dashboard')
  }

  return <PageLayout></PageLayout>
}

export default Page
