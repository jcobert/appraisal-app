import { FC } from 'react'

import AppBreadcrumbs, {
  AppBreadcrumbsProps,
} from '@/components/layout/sidebar-nav/app-breadcrumbs'

import { PageParams } from '@/types/general'

type Props = PageParams<Pick<AppBreadcrumbsProps, 'segments'>>

const Page: FC<Props> = async ({ params }) => {
  const { segments } = await params

  return <AppBreadcrumbs segments={segments} />
}

export default Page
