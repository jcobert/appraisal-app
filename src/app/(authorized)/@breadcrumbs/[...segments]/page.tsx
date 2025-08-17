import { FC } from 'react'

import { AppBreadcrumbsProps } from '@/components/layout/app-nav/app-breadcrumbs'

import { PageParams } from '@/types/general'

type Props = PageParams<Pick<AppBreadcrumbsProps, 'segments'>>

const Page: FC<Props> = async () => {
  return null
  // const { segments } = await params
  // return <AppBreadcrumbs segments={segments} />
}

export default Page
