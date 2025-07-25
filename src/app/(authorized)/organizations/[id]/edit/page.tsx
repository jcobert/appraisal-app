import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { FC } from 'react'

import { getOrganization } from '@/lib/db/queries/organization'

import { userCan } from '@/utils/auth'

import Crumbs from '@/components/layout/app-nav/crumbs'
import FullScreenLoader from '@/components/layout/full-screen-loader'

import { PageParams } from '@/types/general'

import { generatePageMeta } from '@/configuration/seo'
import OrganizationForm from '@/features/organization/organization-form'

export const metadata: Metadata = generatePageMeta({
  title: 'Organizations',
})

type Props = PageParams<{ id: string }>

const Page: FC<Props> = async ({ params }) => {
  const organizationId = (await params)?.id

  const can = await userCan({
    action: 'edit_org_info',
    area: 'organization',
    organizationId,
  })

  if (!can) {
    redirect('/')
  }

  if (!can) return <FullScreenLoader />

  const data = await getOrganization({ organizationId })

  return (
    <>
      <Crumbs crumbs={[{ segment: organizationId, name: data?.name }]} />
      <OrganizationForm initialData={data} />
    </>
  )
}

export default Page
