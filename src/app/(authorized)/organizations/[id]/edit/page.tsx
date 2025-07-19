import { Metadata } from 'next'
import { FC } from 'react'

import { getOrganization } from '@/lib/db/queries/organization'

import { protectPage } from '@/utils/auth'

import Crumbs from '@/components/layout/app-nav/crumbs'

import { PageParams } from '@/types/general'

import { generatePageMeta } from '@/configuration/seo'
import OrganizationForm from '@/features/organization/organization-form'

export const metadata: Metadata = generatePageMeta({
  title: 'Organizations',
})

type Props = PageParams<{ id: string }>

const Page: FC<Props> = async ({ params }) => {
  await protectPage()

  const organizationId = (await params)?.id

  const data = await getOrganization({ organizationId })

  return (
    <>
      <Crumbs crumbs={[{ segment: organizationId, name: data?.name }]} />
      <OrganizationForm initialData={data} />
    </>
  )
}

export default Page
