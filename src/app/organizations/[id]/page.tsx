import { HydrationBoundary, dehydrate } from '@tanstack/react-query'
import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { FC } from 'react'

import { getOrganization, userIsMember } from '@/lib/db/queries/organization'

import { protectPage } from '@/utils/auth'
import { FetchResponse } from '@/utils/fetch'
import { createQueryClient } from '@/utils/query'

import { organizationsQueryKey } from '@/components/features/organization/hooks/use-get-organizations'
import OrganizationPage from '@/components/features/organization/organization-page'
import PageLayout from '@/components/layout/page-layout'

import { PageParams } from '@/types/general'

import { generatePageMeta } from '@/configuration/seo'

type Props = PageParams<{ id: string }>

export const metadata: Metadata = generatePageMeta({
  title: 'Organizations',
})

const Page: FC<Props> = async ({ params }) => {
  const organizationId = (await params)?.id

  /** @TODO redirect to a generic "you must sign in to access this" page rather than directly to login? */
  await protectPage({
    redirectUrl: `/api/auth/login?post_login_redirect_url=/organizations/${organizationId}`,
  })

  const isMember = await userIsMember({ organizationId })

  /** @TODO redirect to a "no permission" page? */
  if (!isMember) {
    redirect('/dashboard')
  }

  const queryClient = createQueryClient()

  await queryClient.prefetchQuery({
    queryKey: organizationsQueryKey.filtered({ id: organizationId }),
    queryFn: async () => {
      const data = await getOrganization({ where: { id: organizationId } })
      return { data } satisfies FetchResponse
    },
  })

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <PageLayout>
        <OrganizationPage organizationId={organizationId} />
      </PageLayout>
    </HydrationBoundary>
  )
}

export default Page
