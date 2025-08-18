import { HydrationBoundary, dehydrate } from '@tanstack/react-query'
import { Metadata } from 'next'
import { FC } from 'react'

import { CORE_API_ENDPOINTS } from '@/lib/db/config'
import { protectPage } from '@/lib/db/utils'

import coreFetch, { getAbsoluteUrl } from '@/utils/fetch'
import { createQueryClient } from '@/utils/query'

import { permissionsQueryKey } from '@/hooks/use-permissions'

import { PageParams } from '@/types/general'

import { generatePageMeta } from '@/configuration/seo'
import { orgMemberQueryKey } from '@/features/organization/hooks/use-get-org-member'
import { organizationsQueryKey } from '@/features/organization/hooks/use-get-organizations'
import OrgMemberPage from '@/features/organization/member/org-member-page'

type Props = PageParams<{ id: string; memberId: string }>

export const metadata: Metadata = generatePageMeta({
  title: 'Members',
})

const Page: FC<Props> = async ({ params }) => {
  const { id: organizationId, memberId } = await params

  await protectPage({
    permission: { area: 'organization', action: 'view_org', organizationId },
  })

  const queryClient = createQueryClient()

  await Promise.all([
    // Org
    queryClient.prefetchQuery({
      queryKey: organizationsQueryKey.filtered({ id: organizationId }),
      queryFn: () =>
        coreFetch.GET({
          url: getAbsoluteUrl(
            `${CORE_API_ENDPOINTS.organization}/${organizationId}`,
          ),
        }),
    }),
    // Org member
    queryClient.prefetchQuery({
      queryKey: orgMemberQueryKey.filtered({
        organizationId,
        memberId,
      }),
      queryFn: () =>
        coreFetch.GET({
          url: getAbsoluteUrl(
            `${CORE_API_ENDPOINTS.organization}/${organizationId}/members/${memberId}`,
          ),
        }),
    }),
    // Permissions
    queryClient.prefetchQuery({
      queryKey: permissionsQueryKey.filtered({
        area: 'organization',
        organizationId,
      }),
      queryFn: () =>
        coreFetch.GET({
          url: getAbsoluteUrl(
            `${CORE_API_ENDPOINTS.organization}/${organizationId}/permissions`,
          ),
        }),
    }),
  ])

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <OrgMemberPage organizationId={organizationId} memberId={memberId} />
    </HydrationBoundary>
  )
}

export default Page
