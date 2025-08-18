import { HydrationBoundary, dehydrate } from '@tanstack/react-query'
import { Metadata } from 'next'
import { FC } from 'react'

import { getOrgMember } from '@/lib/db/queries/organization'
import { protectPage } from '@/lib/db/utils'

import { FetchResponse } from '@/utils/fetch'
import { createQueryClient } from '@/utils/query'

import { PageParams } from '@/types/general'

import { generatePageMeta } from '@/configuration/seo'
import { orgMemberQueryKey } from '@/features/organization/hooks/use-get-org-member'
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

  await queryClient.prefetchQuery({
    queryKey: orgMemberQueryKey.filtered({ organizationId, memberId }),
    queryFn: async () => {
      const data = await getOrgMember({ organizationId, memberId })
      return { data } satisfies FetchResponse
    },
  })

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <OrgMemberPage organizationId={organizationId} memberId={memberId} />
    </HydrationBoundary>
  )
}

export default Page
