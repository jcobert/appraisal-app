import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { FC } from 'react'

import { isAllowedServer } from '@/utils/auth'

import PageLayout from '@/components/layout/page-layout'

import { buildPageTitle } from '@/configuration/seo'

export const metadata: Metadata = {
  title: buildPageTitle('Home'),
}

const Page: FC = async () => {
  const { allowed } = await isAllowedServer()
  if (allowed) {
    redirect('/dashboard')
  }

  return <PageLayout></PageLayout>
}

export default Page
