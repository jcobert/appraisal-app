import { HydrationBoundary, dehydrate } from '@tanstack/react-query'
import { Metadata } from 'next'
import { FC } from 'react'

import { getOrganization } from '@/lib/db/operations/organization'

import { protect } from '@/utils/auth'
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
  await protect()

  const organizationId = (await params)?.id

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
