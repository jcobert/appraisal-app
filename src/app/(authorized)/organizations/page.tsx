import { HydrationBoundary, dehydrate } from '@tanstack/react-query'
import { Metadata } from 'next'
import { FC } from 'react'

import { getUserOrganizations } from '@/lib/db/queries/organization'

import { protectPage } from '@/utils/auth'
import { FetchResponse } from '@/utils/fetch'
import { createQueryClient } from '@/utils/query'

import { organizationsQueryKey } from '@/features/organization/hooks/use-get-organizations'
import OrganizationsPage from '@/features/organization/organizations-page'
import PageLayout from '@/components/layout/page-layout'

import { PageParams } from '@/types/general'

import { generatePageMeta } from '@/configuration/seo'
import { canonicalUrl } from '@/configuration/site'

export const metadata: Metadata = generatePageMeta({
  title: 'Organizations',
  url: canonicalUrl('/organizations'),
})

type Props = PageParams

const Page: FC<Props> = async () => {
  await protectPage()

  const queryClient = createQueryClient()

  await queryClient.prefetchQuery({
    queryKey: organizationsQueryKey.all,
    queryFn: async () => {
      const data = await getUserOrganizations()
      return { data } satisfies FetchResponse
    },
  })

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <PageLayout heading='Organizations' className='max-md:mt-4'>
        <OrganizationsPage />
      </PageLayout>
    </HydrationBoundary>
  )
}

export default Page
