import { Metadata } from 'next'
import { FC } from 'react'

import { protectPage } from '@/utils/auth'

import OrganizationForm from '@/features/organization/organization-form'
import PageLayout from '@/components/layout/page-layout'

import { PageParams } from '@/types/general'

import { generatePageMeta } from '@/configuration/seo'

export const metadata: Metadata = generatePageMeta({
  title: 'Organizations',
})

type Props = PageParams

const Page: FC<Props> = async () => {
  await protectPage()

  return (
    <PageLayout>
      <OrganizationForm />
    </PageLayout>
  )
}

export default Page
