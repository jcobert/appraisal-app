import { Metadata } from 'next'
import { FC } from 'react'

import { protectPage } from '@/utils/auth'

import { PageParams } from '@/types/general'

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
