import { Metadata } from 'next'
import { FC } from 'react'

import { getAppraiser } from '@/lib/db/queries/appraiser'

import { protectPage } from '@/utils/auth'

import { PageParams } from '@/types/general'

import { generatePageMeta } from '@/configuration/seo'
import AppraiserForm from '@/features/appraiser/appraiser-form'

export const metadata: Metadata = generatePageMeta({
  title: 'Appraisers',
})

type Props = PageParams<{ id?: string }>

const Page: FC<Props> = async ({ params }) => {
  await protectPage()

  const id = (await params)?.id

  const data = await getAppraiser({ where: { id } })

  return <AppraiserForm initialData={data} />
}

export default Page
