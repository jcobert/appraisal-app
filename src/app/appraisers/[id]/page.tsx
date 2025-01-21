import { HydrationBoundary, dehydrate } from '@tanstack/react-query'
import { Metadata } from 'next'
import { FC } from 'react'

import { db } from '@/lib/db/client'

import { protectPage } from '@/utils/auth'
import { createQueryClient } from '@/utils/query'

import AppraiserPage from '@/components/features/appraiser/appraiser-page'
import { appraisersQueryKey } from '@/components/features/appraiser/hooks/use-get-appraisers'
import PageLayout from '@/components/layout/page-layout'

import { PageParams } from '@/types/general'

import { generatePageMeta } from '@/configuration/seo'

type Props = PageParams<{ id: string }>

export const metadata: Metadata = generatePageMeta({
  title: 'Appraisers',
})

// export const generateMetadata = async ({ params }: Props) => {
//   const appraiserId = (await params)?.id
//   const data = await db.appraiser.findUnique({ where: { id: appraiserId } })

//   return generatePageMeta({
//     title: `Appraisers - ${fullName(data?.firstName, data?.lastName)}`,
//     url: canonicalUrl('/appraisers'),
//   })
// }

const Page: FC<Props> = async ({ params }) => {
  await protectPage()

  const appraiserId = (await params)?.id

  const queryClient = createQueryClient()

  const data = await db.appraiser.findUnique({ where: { id: appraiserId } })

  await queryClient.prefetchQuery({
    queryKey: appraisersQueryKey.filtered({ id: appraiserId }),
    initialData: { data },
  })

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <PageLayout>
        <AppraiserPage appraiser={data} />
      </PageLayout>
    </HydrationBoundary>
  )
}

export default Page
