import { CustomCellRendererProps } from 'ag-grid-react'

import Avatar from '@/components/general/avatar'

import { OrdersTableData } from '@/features/orders/orders-table'

const ClientCell = ({
  value,
}: CustomCellRendererProps<OrdersTableData, OrdersTableData['client']>) => {
  if (!value) return null
  return (
    <div className='flex gap-2 items-center h-full'>
      <Avatar
        aria-hidden
        image={value?.logo}
        name={value?.name || ''}
        size='xs'
      />
      <span className='truncate'>{value?.name}</span>
    </div>
  )
}

export default ClientCell
