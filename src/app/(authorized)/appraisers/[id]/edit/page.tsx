import { Metadata } from 'next'
import { FC } from 'react'

import { getAppraiser } from '@/lib/db/queries/appraiser'

import { protectPage } from '@/utils/auth'

import AppraiserForm from '@/features/appraiser/appraiser-form'
import PageLayout from '@/components/layout/page-layout'

import { PageParams } from '@/types/general'

import { generatePageMeta } from '@/configuration/seo'

export const metadata: Metadata = generatePageMeta({
  title: 'Appraisers',
})

type Props = PageParams<{ id?: string }>

const Page: FC<Props> = async ({ params }) => {
  await protectPage()

  const id = (await params)?.id

  const data = await getAppraiser({ where: { id } })

  return (
    <PageLayout>
      <AppraiserForm initialData={data} />
    </PageLayout>
  )
}

export default Page
