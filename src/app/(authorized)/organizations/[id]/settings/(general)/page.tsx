import { Metadata } from 'next'
import { FC } from 'react'

import { getOrganization } from '@/lib/db/queries/organization'
import { protectPage } from '@/lib/db/utils'

import { FetchResponse } from '@/utils/fetch'
import { createQueryClient } from '@/utils/query'

import FullScreenLoader from '@/components/layout/full-screen-loader'

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

  await queryClient.prefetchQuery({
    queryKey: organizationsQueryKey.filtered({ id: organizationId }),
    queryFn: async () => {
      const data = await getOrganization({ organizationId })
      return { data } satisfies FetchResponse
    },
  })

  if (!can) return <FullScreenLoader />

  return <GeneralSettings organizationId={organizationId} />
}

export default Page
