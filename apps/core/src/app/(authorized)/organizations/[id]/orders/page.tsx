import Link from 'next/link'
import { FC } from 'react'

import { PageParams } from '@repo/types'
import { Button } from '@repo/ui'

import { handleGetOrders } from '@/lib/db/handlers/order-handlers'
import { protectPage, userCan } from '@/lib/db/utils'

import { createQueryClient, prefetchQuery } from '@/utils/query'

import Heading from '@/components/layout/heading'

import { ordersQueryKey } from '@/configuration/react-query/query-keys'
import OrdersOverview from '@/features/orders/orders-overview'

const Page: FC<PageParams<{ id: string }>> = async ({ params }) => {
  const organizationId = (await params)?.id

  await protectPage({ permission: { action: 'orders:view', organizationId } })

  const queryClient = createQueryClient()

  await Promise.all([
    queryClient.prefetchQuery({
      queryKey: ordersQueryKey.filtered({ organizationId }),
      queryFn: prefetchQuery(() => handleGetOrders(organizationId)),
    }),
  ])

  const userCanEdit = await userCan({ action: 'orders:edit', organizationId })

  return (
    <div className='flex flex-col gap-4'>
      <div className='flex flex-col gap-4'>
        <Heading text='Orders' />
        <div className='flex justify-end'>
          <Button asChild variant='outline'>
            <Link href={`/organizations/${organizationId}/orders/create`}>
              Create order
            </Link>
          </Button>
        </div>
      </div>
      <OrdersOverview organizationId={organizationId} readonly={!userCanEdit} />
    </div>
  )
}

export default Page
