import { HydrationBoundary, dehydrate } from '@tanstack/react-query'
import { Metadata } from 'next'
import { FC } from 'react'

import { getOrganization } from '@/lib/db/queries/organization'

import { protectPage } from '@/utils/auth'
import { FetchResponse } from '@/utils/fetch'
import { createQueryClient } from '@/utils/query'

import Crumbs from '@/components/layout/app-nav/crumbs'

import { PageParams } from '@/types/general'

import { generatePageMeta } from '@/configuration/seo'
import { organizationsQueryKey } from '@/features/organization/hooks/use-get-organizations'
import OrganizationPage from '@/features/organization/organization-page'

type Props = PageParams<{ id: string }>

export const metadata: Metadata = generatePageMeta({
  title: 'Organizations',
})

const Page: FC<Props> = async ({ params }) => {
  const organizationId = (await params)?.id

  await protectPage({
    permission: { area: 'organization', action: 'view_org', organizationId },
  })

  const queryClient = createQueryClient()

  const res = await queryClient.fetchQuery({
    queryKey: organizationsQueryKey.filtered({ id: organizationId }),
    queryFn: async () => {
      const data = await getOrganization({ organizationId })
      return { data } satisfies FetchResponse
    },
  })

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Crumbs
        crumbs={[
          { segment: 'organizations', link: false },
          { segment: organizationId, name: res?.data?.name },
        ]}
      />
      <OrganizationPage organizationId={organizationId} />
    </HydrationBoundary>
  )
}

export default Page
