import { Metadata } from 'next'
import { FC } from 'react'

import { PageParams } from '@repo/types'

import { protectPage } from '@/lib/db/utils'

import { generatePageMeta } from '@/configuration/seo'
import OrganizationForm from '@/features/organization/organization-form'

export const metadata: Metadata = generatePageMeta({
  title: 'Organizations',
})

type Props = PageParams

const Page: FC<Props> = async () => {
  await protectPage()

  return <OrganizationForm />
}

export default Page
