'use client'

import { FC } from 'react'

import NoResults from '@/components/general/no-results'

import { useGetOrders } from '@/features/orders/hooks/use-order-queries'
import OrdersTable, { OrdersTableProps } from '@/features/orders/orders-table'

type Props = {
  organizationId: string
} & Pick<OrdersTableProps, 'readonly'>

const OrdersOverview: FC<Props> = ({ organizationId, readonly }) => {
  const { response, isFetched } = useGetOrders({ organizationId })

  const orders = response?.data

  if (isFetched && !orders) return <NoResults />

  return (
    <div>
      <OrdersTable data={orders} readonly={readonly} />
    </div>
  )
}

export default OrdersOverview
