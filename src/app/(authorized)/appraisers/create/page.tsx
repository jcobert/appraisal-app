import { Metadata } from 'next'
import { FC } from 'react'

import { protectPage } from '@/utils/auth'

import { PageParams } from '@/types/general'

import { generatePageMeta } from '@/configuration/seo'
import AppraiserForm from '@/features/appraiser/appraiser-form'

export const metadata: Metadata = generatePageMeta({
  title: 'Appraisers',
})

type Props = PageParams

const Page: FC<Props> = async () => {
  await protectPage()

  return <AppraiserForm />
}

export default Page
