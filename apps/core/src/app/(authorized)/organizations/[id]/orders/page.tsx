import { FC } from 'react'

import { PageParams } from '@repo/types'

import { protectPage } from '@/lib/db/utils'

const Page: FC<PageParams<{ id: string }>> = async ({ params }) => {
  const organizationId = (await params)?.id

  await protectPage({ permission: { action: 'orders:view', organizationId } })

  return <div></div>
}

export default Page
