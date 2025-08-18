import { HydrationBoundary, dehydrate } from '@tanstack/react-query'
import { Metadata } from 'next'
import { FC } from 'react'

import {
  getActiveUserOrgMember,
  getOrganization,
} from '@/lib/db/queries/organization'
import { getUserPermissions, protectPage } from '@/lib/db/utils'

import { FetchResponse } from '@/utils/fetch'
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
    queryClient.prefetchQuery({
      queryKey: organizationsQueryKey.filtered({ id: organizationId }),
      queryFn: async () => {
        const data = await getOrganization({ organizationId })
        return { data } satisfies FetchResponse
      },
    }),
    queryClient.prefetchQuery({
      queryKey: orgMemberQueryKey.filtered({
        organizationId,
        activeUser: true,
      }),
      queryFn: async () => {
        const data = await getActiveUserOrgMember({ organizationId })
        return { data } satisfies FetchResponse
      },
    }),
    queryClient.prefetchQuery({
      queryKey: permissionsQueryKey.filtered({
        area: 'organization',
        organizationId,
      }),
      queryFn: async () => {
        const data = await getUserPermissions(organizationId)
        return { data } satisfies FetchResponse
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
