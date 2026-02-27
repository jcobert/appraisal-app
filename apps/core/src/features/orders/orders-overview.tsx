'use client'

import { FC } from 'react'

import NoResults from '@/components/general/no-results'

import { useGetOrders } from '@/features/orders/hooks/use-order-queries'
import OrdersTable, {
  OrdersTableData,
  OrdersTableProps,
} from '@/features/orders/orders-table'

type Props = {
  organizationId: string
} & Pick<OrdersTableProps, 'readonly'>

const OrdersOverview: FC<Props> = ({ organizationId, readonly }) => {
  const { response, isFetched } = useGetOrders({ organizationId })

  const orders = response?.data

  if (isFetched && !orders) return <NoResults />

  const tableData = orders?.map((ord) => {
    const { baseFee, techFee, questionnaireFee } = ord
    const totalFee = (baseFee || 0) + (techFee || 0) + (questionnaireFee || 0)

    return {
      ...ord,
      fees: {
        baseFee: ord.baseFee,
        techFee: ord.techFee,
        questionnaireFee: ord.questionnaireFee,
        totalFee,
      },
    } satisfies OrdersTableData
  })

  return (
    <div>
      <OrdersTable data={tableData} readonly={readonly} />
    </div>
  )
}

export default OrdersOverview
