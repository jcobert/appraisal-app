import { Metadata } from 'next'
import { FC } from 'react'

import { PageParams } from '@/types/general'

import { generatePageMeta } from '@/configuration/seo'

export const metadata: Metadata = generatePageMeta({
  title: 'User Settings',
})

type Props = PageParams

const Page: FC<Props> = async () => {
  return <div></div>
}

export default Page
