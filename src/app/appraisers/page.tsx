import { Metadata } from 'next'
import { FC } from 'react'

import AppraiserForm from '@/components/features/appraiser/appraiser-form'
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
  return (
    <PageLayout heading='Appraisers'>
      <AppraiserForm />
    </PageLayout>
  )
}

export default Page
