import { HydrationBoundary, dehydrate } from '@tanstack/react-query'
import { Metadata } from 'next'
import { FC } from 'react'

import { getAppraisers } from '@/lib/db/queries/appraiser'

import { protectPage } from '@/utils/auth'
import { FetchResponse } from '@/utils/fetch'
import { createQueryClient } from '@/utils/query'

import AppraisersPage from '@/components/features/appraiser/appraisers-page'
import { appraisersQueryKey } from '@/components/features/appraiser/hooks/use-get-appraisers'
import PageLayout from '@/components/layout/page-layout'

import { PageParams } from '@/types/general'

import { generatePageMeta } from '@/configuration/seo'
import { canonicalUrl } from '@/configuration/site'

export const metadata: Metadata = generatePageMeta({
  title: 'Appraisers',
  url: canonicalUrl('/appraisers'),
})

type Props = PageParams

const Page: FC<Props> = async () => {
  await protectPage()

  const queryClient = createQueryClient()

  await queryClient.prefetchQuery({
    queryKey: appraisersQueryKey.all,
    queryFn: async () => {
      const data = await getAppraisers()
      return { data } satisfies FetchResponse
    },
  })

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <PageLayout heading='Appraisers' className='max-md:mt-4'>
        <AppraisersPage />
      </PageLayout>
    </HydrationBoundary>
  )
}

export default Page
