import { HydrationBoundary, dehydrate } from '@tanstack/react-query'
import { Metadata } from 'next'
import { FC } from 'react'

import { getUserOrganizations } from '@/lib/db/queries/organization'

import { protectPage } from '@/utils/auth'
import { FetchResponse } from '@/utils/fetch'
import { createQueryClient } from '@/utils/query'

import Heading from '@/components/layout/heading'

import { PageParams } from '@/types/general'

import { generatePageMeta } from '@/configuration/seo'
import { canonicalUrl } from '@/configuration/site'
import { organizationsQueryKey } from '@/features/organization/hooks/use-get-organizations'
import OrganizationsPage from '@/features/organization/organizations-page'

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
      <div className='max-md:mt-4 flex flex-col gap-2'>
        <Heading text='Organizations' />
        <OrganizationsPage />
      </div>
    </HydrationBoundary>
  )
}

export default Page
