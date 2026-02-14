import Link from 'next/link'
import { FC } from 'react'

import { PageParams } from '@repo/types'
import { Button } from '@repo/ui'

import { protectPage } from '@/lib/db/utils'

import Heading from '@/components/layout/heading'

const Page: FC<PageParams<{ id: string }>> = async ({ params }) => {
  const organizationId = (await params)?.id

  await protectPage({ permission: { action: 'orders:view', organizationId } })

  // const userCanEdit = await userCan({ action: 'orders:edit', organizationId })

  return (
    <div>
      <Heading text='Orders' />
      <Button asChild variant='outline'>
        <Link href={`/organizations/${organizationId}/orders/create`}>
          Create order
        </Link>
      </Button>
      {/* <OrdersTable data={data} readonly={!userCanEdit} /> */}
    </div>
  )
}

export default Page
