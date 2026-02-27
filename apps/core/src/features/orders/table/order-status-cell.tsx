import { CustomCellRendererProps } from 'ag-grid-react'

import { Badge, BadgeProps } from '@repo/ui'

import { OrdersTableData } from '@/features/orders/orders-table'

const getVariant = (
  value: OrdersTableData['orderStatus'] | undefined,
): BadgeProps['variant'] => {
  switch (value) {
    case 'open':
      return 'success'
    case 'cancelled':
      return 'failure'
    case 'closed':
      return 'neutral'
    default:
      return 'neutral'
  }
}

const OrderStatusCell = ({
  value,
  valueFormatted,
}: CustomCellRendererProps<
  OrdersTableData,
  OrdersTableData['orderStatus']
>) => {
  const label = valueFormatted || value
  const variant = getVariant(value)
  return <Badge variant={variant}>{label}</Badge>
}

export default OrderStatusCell
