import { HydrationBoundary, dehydrate } from '@tanstack/react-query'
import { Metadata } from 'next'
import { FC } from 'react'

import { PageParams } from '@repo/types'

import {
  handleGetOrganization,
  handleGetOrganizationPermissions,
} from '@/lib/db/handlers/organization-handlers'
import { protectPage } from '@/lib/db/utils'

import { successful } from '@/utils/fetch'
import { createQueryClient } from '@/utils/query'

import FullScreenLoader from '@/components/layout/full-screen-loader'

import {
  organizationsQueryKey,
  permissionsQueryKey,
} from '@/configuration/react-query/query-keys'
import { generatePageMeta } from '@/configuration/seo'
import GeneralSettings from '@/features/organization/settings/general/general-settings'

export const metadata: Metadata = generatePageMeta({
  title: 'Organization Settings',
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
      <GeneralSettings organizationId={organizationId} />
    </HydrationBoundary>
  )
}

export default Page
