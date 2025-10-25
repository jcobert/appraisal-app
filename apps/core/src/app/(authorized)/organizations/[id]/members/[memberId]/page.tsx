import { HydrationBoundary, dehydrate } from '@tanstack/react-query'
import { Metadata } from 'next'
import { FC } from 'react'

import { PageParams } from '@repo/types'

import {
  handleGetOrganization,
  handleGetOrganizationPermissions,
} from '@/lib/db/handlers/organization-handlers'
import { handleGetOrgMember } from '@/lib/db/handlers/organization-member-handlers'
import { protectPage } from '@/lib/db/utils'

import { isStatusCodeSuccess } from '@/utils/fetch'
import { createQueryClient } from '@/utils/query'

import {
  orgMemberQueryKey,
  organizationsQueryKey,
  permissionsQueryKey,
} from '@/configuration/react-query/query-keys'
import { generatePageMeta } from '@/configuration/seo'
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
      queryFn: async () => {
        const result = await handleGetOrganization(organizationId)
        if (!isStatusCodeSuccess(result.status)) {
          throw new Error(
            result.error?.message || 'Failed to fetch organization',
          )
        }
        return result
      },
    }),
    // Org member
    queryClient.prefetchQuery({
      queryKey: orgMemberQueryKey.filtered({
        organizationId,
        memberId,
      }),
      queryFn: async () => {
        const result = await handleGetOrgMember(organizationId, memberId)
        if (!isStatusCodeSuccess(result.status)) {
          throw new Error(
            result.error?.message || 'Failed to fetch organization member',
          )
        }
        return result
      },
    }),
    // Permissions
    queryClient.prefetchQuery({
      queryKey: permissionsQueryKey.filtered({
        area: 'organization',
        organizationId,
      }),
      queryFn: async () => {
        const result = await handleGetOrganizationPermissions(organizationId)
        if (!isStatusCodeSuccess(result.status)) {
          throw new Error(
            result.error?.message || 'Failed to fetch permissions',
          )
        }
        return result
      },
    }),
  ])

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <OrgMemberPage organizationId={organizationId} memberId={memberId} />
    </HydrationBoundary>
  )
}

export default Page
