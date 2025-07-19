import { HydrationBoundary, dehydrate } from '@tanstack/react-query'
import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { FC } from 'react'

import { getOrganization, userIsMember } from '@/lib/db/queries/organization'

import { authRedirectUrl, protectPage } from '@/utils/auth'
import { FetchResponse } from '@/utils/fetch'
import { createQueryClient } from '@/utils/query'

import Crumb from '@/components/layout/app-nav/crumb'

import { PageParams } from '@/types/general'

import { generatePageMeta } from '@/configuration/seo'
import { organizationsQueryKey } from '@/features/organization/hooks/use-get-organizations'
import OrganizationPage from '@/features/organization/organization-page'

type Props = PageParams<{ id: string }>

export const metadata: Metadata = generatePageMeta({
  title: 'Organizations',
})

const Page: FC<Props> = async ({ params }) => {
  const organizationId = (await params)?.id

  /** @TODO redirect to a generic "you must sign in to access this" page rather than directly to login? */
  await protectPage({
    redirectUrl: authRedirectUrl(`/organizations/${organizationId}`),
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

  const org = await queryClient.fetchQuery({
    queryKey: organizationsQueryKey.filtered({ id: organizationId }),
    queryFn: async () => {
      const data = await getOrganization({ organizationId })
      return { data } satisfies FetchResponse
    },
  })

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Crumb segment={organizationId} name={org?.data?.name || ''} />
      <OrganizationPage organizationId={organizationId} />
    </HydrationBoundary>
  )
}

export default Page
