import Link from 'next/link'
import { FC } from 'react'

import { PageParams } from '@repo/types'
import { Button } from '@repo/ui'

import { protectPage, userCan } from '@/lib/db/utils'

import Heading from '@/components/layout/heading'

import OrdersTable, { OrdersTableData } from '@/features/orders/orders-table'

const Page: FC<PageParams<{ id: string }>> = async ({ params }) => {
  const organizationId = (await params)?.id

  await protectPage({ permission: { action: 'orders:view', organizationId } })

  // const userCanEdit = await userCan({ action: 'orders:edit', organizationId })

  // const data: OrdersTableData[] = [
  //   {
  //     id: '1',
  //     appraisalType: 'purchase',
  //     fileNumber: 'ABC1234',
  //     orderDate: new Date('2026-01-25'),
  //     techFee: 200,
  //     orderStatus: 'open',
  //     dueDate: new Date('2026-02-18'),
  //   },
  // ]

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
