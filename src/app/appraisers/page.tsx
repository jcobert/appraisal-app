import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server'
import { HydrationBoundary, dehydrate } from '@tanstack/react-query'
import { Metadata } from 'next'
import { FC } from 'react'

import { db } from '@/lib/db/client'

import { createQueryClient } from '@/utils/query'

import AppraisersPage from '@/components/features/appraiser/appraisers-page'
import { appraisersQueryKey } from '@/components/features/appraiser/hooks/use-get-appraisers'
import PageLayout from '@/components/layout/page-layout'

import { PageParams } from '@/types/general'

import { generatePageMeta } from '@/configuration/seo'
import { canonicalUrl } from '@/configuration/site'

export const metadata: Metadata = generatePageMeta({
  title: 'Appraisers',
  description: '',
  url: canonicalUrl('/appraisers'),
})

type Props = PageParams

const Page: FC<Props> = async () => {
  const { isAuthenticated } = getKindeServerSession()

  const isLoggedIn = await isAuthenticated()

  // await protectPage()

  const queryClient = createQueryClient()

  if (isLoggedIn) {
    const data = await db.appraiser.findMany()
    await queryClient.prefetchQuery({
      queryKey: appraisersQueryKey.all,
      initialData: { data },
    })
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <PageLayout heading='Appraisers'>
        <AppraisersPage />
      </PageLayout>
    </HydrationBoundary>
  )
}

export default Page
