import { Metadata } from 'next'
import { FC } from 'react'

import { protectPage } from '@/utils/auth'

import AppraiserForm from '@/features/appraiser/appraiser-form'
import PageLayout from '@/components/layout/page-layout'

import { PageParams } from '@/types/general'

import { generatePageMeta } from '@/configuration/seo'

export const metadata: Metadata = generatePageMeta({
  title: 'Appraisers',
})

type Props = PageParams

const Page: FC<Props> = async () => {
  await protectPage()

  return (
    <PageLayout>
      <AppraiserForm />
    </PageLayout>
  )
}

export default Page
