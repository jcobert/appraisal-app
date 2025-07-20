import { HydrationBoundary, dehydrate } from '@tanstack/react-query'
import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { FC } from 'react'

import { getOrgMember, userIsMember } from '@/lib/db/queries/organization'

import { authRedirectUrl, protectPage } from '@/utils/auth'
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

  /** @TODO redirect to a generic "you must sign in to access this" page rather than directly to login? */
  await protectPage({
    redirectUrl: authRedirectUrl({
      type: 'login',
      redirectTo: `/organizations/${organizationId}/members/${memberId}`,
    }),
  })

  const isMember = await userIsMember({ organizationId })

  /**
   * @TODO redirect to a "no permission" page?
   * or maybe redirect to dashboard but also show toast.
   */
  if (!isMember) {
    redirect('/dashboard')
  }

  const queryClient = createQueryClient()

  await queryClient.prefetchQuery({
    queryKey: orgMemberQueryKey.filtered({ organizationId, id: memberId }),
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
