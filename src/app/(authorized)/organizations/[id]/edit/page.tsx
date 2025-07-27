import { Metadata } from 'next'
import { FC } from 'react'

import { getOrganization } from '@/lib/db/queries/organization'
import { protectPage } from '@/lib/db/utils'

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

  const { can } = await protectPage({
    permission: {
      area: 'organization',
      action: 'edit_org_info',
      organizationId,
    },
  })

  if (!can) return <FullScreenLoader />

  const data = await getOrganization({ organizationId })

  return (
    <>
      <Crumbs
        crumbs={[
          { segment: 'organizations', link: false },
          { segment: organizationId, name: data?.name },
        ]}
      />
      <OrganizationForm initialData={data} />
    </>
  )
}

export default Page
