import { HydrationBoundary, dehydrate } from '@tanstack/react-query'
import { Metadata } from 'next'
import { FC } from 'react'

import { getAppraiser } from '@/lib/db/queries/appraiser'

import { protectPage } from '@/utils/auth'
import { FetchResponse } from '@/utils/fetch'
import { createQueryClient } from '@/utils/query'

import { PageParams } from '@/types/general'

import { generatePageMeta } from '@/configuration/seo'
import AppraiserPage from '@/features/appraiser/appraiser-page'
import { appraisersQueryKey } from '@/features/appraiser/hooks/use-get-appraisers'

type Props = PageParams<{ id: string }>

export const metadata: Metadata = generatePageMeta({
  title: 'Appraisers',
})

const Page: FC<Props> = async ({ params }) => {
  await protectPage()

  const appraiserId = (await params)?.id

  const queryClient = createQueryClient()

  await queryClient.prefetchQuery({
    queryKey: appraisersQueryKey.filtered({ id: appraiserId }),
    queryFn: async () => {
      const data = await getAppraiser({ where: { id: appraiserId } })
      return { data } satisfies FetchResponse
    },
  })

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <AppraiserPage appraiserId={appraiserId} />
    </HydrationBoundary>
  )
}

export default Page
