import { Metadata } from 'next'
import { FC } from 'react'

import PageLayout from '@/components/layout/page-layout'

import { PageParams } from '@/types/general'

import { generatePageMeta } from '@/configuration/seo'
import { canonicalUrl } from '@/configuration/site'

type Props = PageParams<{ id: string }>

export const metadata: Metadata = generatePageMeta({
  title: 'Appraisers',
  url: canonicalUrl('/appraisers'),
})

// export const generateMetadata = async ({ params }: Props) => {
//   const appraiserId = (await params)?.id
//   const data = await db.appraiser.findUnique({ where: { id: appraiserId } })

//   return generatePageMeta({
//     title: `Appraisers - ${fullName(data?.firstName, data?.lastName)}`,
//     url: canonicalUrl('/appraisers'),
//   })
// }

const Page: FC<Props> = async () => {
  return <PageLayout></PageLayout>
}

export default Page
