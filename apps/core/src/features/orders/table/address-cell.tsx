import { CustomCellRendererProps } from 'ag-grid-react'

import { Popover, PopoverContent, PopoverTrigger } from '@repo/ui'

import { OrdersTableData } from '@/features/orders/orders-table'
import { getPropertyAddress } from '@/features/orders/utils'

const AddressCell = ({
  value,
}: CustomCellRendererProps<OrdersTableData, OrdersTableData['property']>) => {
  const { address, cityStateZip } = getPropertyAddress(value)

  return (
    <Popover>
      <PopoverTrigger>{address}</PopoverTrigger>
      <PopoverContent className='flex flex-col'>
        <span>{address}</span>
        <span>{cityStateZip}</span>
      </PopoverContent>
    </Popover>
  )
}

export default AddressCell
