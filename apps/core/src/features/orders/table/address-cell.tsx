import { CustomCellRendererProps } from 'ag-grid-react'

import { Popover, PopoverContent, PopoverTrigger } from '@repo/ui'

import { OrdersTableData } from '@/features/orders/orders-table'
import { getPropertyAddress } from '@/features/orders/utils'

const AddressCell = ({
  value,
}: CustomCellRendererProps<OrdersTableData, OrdersTableData['property']>) => {
  const { address, cityStateZip } = getPropertyAddress(value)
  if (!value) return ''
  return (
    <Popover>
      <PopoverTrigger className='hover:text-primary transition'>
        {address}
      </PopoverTrigger>
      <PopoverContent className='flex flex-col text-sm w-fit'>
        <span>{value?.street}</span>
        {value?.street2 ? <span>{value?.street2}</span> : null}
        <span>{cityStateZip}</span>
      </PopoverContent>
    </Popover>
  )
}

export default AddressCell
