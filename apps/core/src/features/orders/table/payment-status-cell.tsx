import { CustomCellRendererProps } from 'ag-grid-react'

import { Badge, BadgeProps } from '@repo/ui'

import { OrdersTableData } from '@/features/orders/orders-table'

const getVariant = (
  value: OrdersTableData['paymentStatus'] | undefined,
): BadgeProps['variant'] => {
  switch (value) {
    case 'paid':
      return 'success'
    case 'partial':
      return 'warning'
    case 'unpaid':
      return 'failure'
    default:
      return 'neutral'
  }
}

const PaymentStatusCell = ({
  value,
  valueFormatted,
}: CustomCellRendererProps<
  OrdersTableData,
  OrdersTableData['paymentStatus']
>) => {
  const label = valueFormatted || value
  const variant = getVariant(value)
  return (
    <Badge variant={variant} className='whitespace-nowrap'>
      {label}
    </Badge>
  )
}

export default PaymentStatusCell
