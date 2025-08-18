import { HydrationBoundary, dehydrate } from '@tanstack/react-query'
import { Metadata } from 'next'
import { FC } from 'react'

import { CORE_API_ENDPOINTS } from '@/lib/db/config'
import { protectPage } from '@/lib/db/utils'

import fetch, { getAbsoluteUrl } from '@/utils/fetch'
import { createQueryClient } from '@/utils/query'

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
      queryFn: () =>
        fetch.GET({
          url: getAbsoluteUrl(
            `${CORE_API_ENDPOINTS.organization}/${organizationId}`,
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
        fetch.GET({
          url: getAbsoluteUrl(
            `${CORE_API_ENDPOINTS.organization}/${organizationId}/permissions`,
          ),
        }),
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
