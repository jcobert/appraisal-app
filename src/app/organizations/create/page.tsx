import { Metadata } from 'next'
import { FC } from 'react'

import { protect } from '@/utils/auth'

import OrganizationForm from '@/components/features/organization/organization-form'
import PageLayout from '@/components/layout/page-layout'

import { PageParams } from '@/types/general'

import { generatePageMeta } from '@/configuration/seo'

export const metadata: Metadata = generatePageMeta({
  title: 'Organizations',
})

type Props = PageParams

const Page: FC<Props> = async () => {
  await protect()

  return (
    <PageLayout>
      <OrganizationForm />
    </PageLayout>
  )
}

export default Page
