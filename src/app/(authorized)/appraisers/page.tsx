import { HydrationBoundary, dehydrate } from '@tanstack/react-query'
import { Metadata } from 'next'
import { FC } from 'react'

import { getAppraisers } from '@/lib/db/queries/appraiser'

import { protectPage } from '@/utils/auth'
import { FetchResponse } from '@/utils/fetch'
import { createQueryClient } from '@/utils/query'

import { PageParams } from '@/types/general'

import { generatePageMeta } from '@/configuration/seo'
import { canonicalUrl } from '@/configuration/site'
import AppraisersPage from '@/features/appraiser/appraisers-page'
import { appraisersQueryKey } from '@/features/appraiser/hooks/use-get-appraisers'

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
      <div className='max-md:mt-4'>
        <AppraisersPage />
      </div>
    </HydrationBoundary>
  )
}

export default Page
