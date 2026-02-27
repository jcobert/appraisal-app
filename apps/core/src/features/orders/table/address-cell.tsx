import { CustomCellRendererProps } from 'ag-grid-react'

import { Popover, PopoverContent, PopoverTrigger } from '@repo/ui'

import { OrdersTableData } from '@/features/orders/orders-table'
import { PROPERTY_TYPE_LABEL } from '@/features/orders/types'
import { getPropertyAddress } from '@/features/orders/utils'

const AddressCell = ({
  value,
}: CustomCellRendererProps<OrdersTableData, OrdersTableData['property']>) => {
  const { address, cityStateZip } = getPropertyAddress(value)
  if (!value) return ''
  const propertyType = PROPERTY_TYPE_LABEL?.[value.propertyType]
  return (
    <Popover>
      <PopoverTrigger className='hover:text-primary transition'>
        {address}
      </PopoverTrigger>
      <PopoverContent className=''>
        <dl className='flex flex-col gap-3 text-sm'>
          <div className='flex flex-col'>
            <dt className='font-semibold text-muted-foreground'>
              Property Type
            </dt>
            <dd>{propertyType}</dd>
          </div>

          <div className='flex flex-col'>
            <dt className='font-semibold text-muted-foreground'>Address</dt>
            <dd className='flex flex-col'>
              <span>{value?.street}</span>
              {value?.street2 ? <span>{value?.street2}</span> : null}
              <span>{cityStateZip}</span>
            </dd>
          </div>
        </dl>
      </PopoverContent>
    </Popover>
  )
}

export default AddressCell
