import { HydrationBoundary, dehydrate } from '@tanstack/react-query'
import { Metadata } from 'next'
import { FC } from 'react'

import { protectPage } from '@/lib/db/utils'
import { handleGetOrganization, handleGetOrganizationPermissions } from '@/lib/handlers/organization-handlers'

import { createQueryClient } from '@/utils/query'
import { successful } from '@/utils/fetch'

import FullScreenLoader from '@/components/layout/full-screen-loader'

import { permissionsQueryKey } from '@/hooks/use-permissions'

import { PageParams } from '@/types/general'

import { generatePageMeta } from '@/configuration/seo'
import { organizationsQueryKey } from '@/features/organization/hooks/use-get-organizations'
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
          throw new Error(result.error?.message || 'Failed to fetch organization')
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
          throw new Error(result.error?.message || 'Failed to fetch permissions')
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
