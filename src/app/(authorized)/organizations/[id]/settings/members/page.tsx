import { HydrationBoundary, dehydrate } from '@tanstack/react-query'
import { Metadata } from 'next'
import { FC } from 'react'

import { CORE_API_ENDPOINTS } from '@/lib/db/config'
import { protectPage } from '@/lib/db/utils'

import coreFetch, { getAbsoluteUrl } from '@/utils/fetch'
import { createQueryClient } from '@/utils/query'

import FullScreenLoader from '@/components/layout/full-screen-loader'

import { permissionsQueryKey } from '@/hooks/use-permissions'

import { PageParams } from '@/types/general'

import { generatePageMeta } from '@/configuration/seo'
import { orgMemberQueryKey } from '@/features/organization/hooks/use-get-org-member'
import { organizationsQueryKey } from '@/features/organization/hooks/use-get-organizations'
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
      queryFn: () =>
        coreFetch.GET({
          url: getAbsoluteUrl(
            `${CORE_API_ENDPOINTS.organization}/${organizationId}`,
          ),
        }),
    }),
    // Active user org member
    queryClient.prefetchQuery({
      queryKey: orgMemberQueryKey.filtered({
        organizationId,
        activeUser: true,
      }),
      queryFn: () =>
        coreFetch.GET({
          url: getAbsoluteUrl(
            `${CORE_API_ENDPOINTS.organization}/${organizationId}/members/active`,
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

  if (!can) return <FullScreenLoader />

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <MembersSettings organizationId={organizationId} />
    </HydrationBoundary>
  )
}

export default Page
