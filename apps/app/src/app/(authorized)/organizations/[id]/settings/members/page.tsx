import { HydrationBoundary, dehydrate } from '@tanstack/react-query'
import { Metadata } from 'next'
import { FC } from 'react'

import {
  handleGetOrganization,
  handleGetOrganizationPermissions,
} from '@/lib/db/handlers/organization-handlers'
import { handleGetActiveUserOrgMember } from '@/lib/db/handlers/organization-member-handlers'
import { protectPage } from '@/lib/db/utils'

import { successful } from '@/utils/fetch'
import { createQueryClient } from '@/utils/query'

import FullScreenLoader from '@/components/layout/full-screen-loader'

import { PageParams } from '@/types/general'

import {
  orgMemberQueryKey,
  organizationsQueryKey,
  permissionsQueryKey,
} from '@/configuration/react-query/query-keys'
import { generatePageMeta } from '@/configuration/seo'
import MembersSettings from '@/features/organization/settings/members-settings'

export const metadata: Metadata = generatePageMeta({
  title: 'Organization Settings',
})

type Props = PageParams<{ id: string }>

const Page: FC<Props> = async ({ params }) => {
  const organizationId = (await params)?.id

  const { can } = await protectPage({
    permission: {
      area: 'organization',
      action: 'edit_org_members',
      organizationId,
    },
  })

  const queryClient = createQueryClient()

  await Promise.all([
    // Org
    queryClient.prefetchQuery({
      queryKey: organizationsQueryKey.filtered({ id: organizationId }),
      queryFn: async () => {
        const result = await handleGetOrganization(organizationId)
        if (!successful(result.status)) {
          throw new Error(
            result.error?.message || 'Failed to fetch organization',
          )
        }
        return result
      },
    }),
    // Active user org member
    queryClient.prefetchQuery({
      queryKey: orgMemberQueryKey.filtered({
        organizationId,
        activeUser: true,
      }),
      queryFn: async () => {
        const result = await handleGetActiveUserOrgMember(organizationId)
        if (!successful(result.status)) {
          throw new Error(
            result.error?.message ||
              'Failed to fetch active user organization member',
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
        if (!successful(result.status)) {
          throw new Error(
            result.error?.message || 'Failed to fetch permissions',
          )
        }
        return result
      },
    }),
  ])

  if (!can) return <FullScreenLoader />

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <MembersSettings organizationId={organizationId} />
    </HydrationBoundary>
  )
}

export default Page
