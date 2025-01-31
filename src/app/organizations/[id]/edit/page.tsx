import { Metadata } from 'next'
import { FC } from 'react'

import { getOrganization } from '@/lib/db/queries/organization'

import { protectPage } from '@/utils/auth'

import OrganizationForm from '@/components/features/organization/organization-form'
import PageLayout from '@/components/layout/page-layout'

import { PageParams } from '@/types/general'

import { generatePageMeta } from '@/configuration/seo'

export const metadata: Metadata = generatePageMeta({
  title: 'Organizations',
})

type Props = PageParams<{ id?: string }>

const Page: FC<Props> = async ({ params }) => {
  await protectPage()

  const id = (await params)?.id

  const data = await getOrganization({ where: { id } })

  return (
    <PageLayout>
      <OrganizationForm initialData={data} />
    </PageLayout>
  )
}

export default Page
