import { HydrationBoundary, dehydrate } from '@tanstack/react-query'
import { Metadata } from 'next'
import { FC } from 'react'

import { PageParams } from '@repo/types'

import {
  handleGetOrganization,
  handleGetOrganizationPermissions,
} from '@/lib/db/handlers/organization-handlers'
import { protectPage } from '@/lib/db/utils'

import { createQueryClient, prefetchQuery } from '@/utils/query'

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
      action: 'organization:edit',
      organizationId,
    },
  })

  const queryClient = createQueryClient()

  await Promise.all([
    // Org
    queryClient.prefetchQuery({
      queryKey: organizationsQueryKey.filtered({ id: organizationId }),
      queryFn: prefetchQuery(() => handleGetOrganization(organizationId)),
    }),
    // Permissions
    queryClient.prefetchQuery({
      queryKey: permissionsQueryKey.filtered({
        organizationId,
      }),
      queryFn: prefetchQuery(() =>
        handleGetOrganizationPermissions(organizationId),
      ),
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
