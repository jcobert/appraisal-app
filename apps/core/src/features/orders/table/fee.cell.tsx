import { CustomCellRendererProps } from 'ag-grid-react'

import { Popover, PopoverContent, PopoverTrigger } from '@repo/ui'
import { formatCurrency } from '@repo/utils'

import { OrdersTableData } from '@/features/orders/orders-table'

const FeeCell = ({
  value,
}: CustomCellRendererProps<OrdersTableData, OrdersTableData['fees']>) => {
  if (!value) return ''
  return (
    <Popover>
      <PopoverTrigger className='hover:text-primary transition'>
        {formatCurrency(value?.totalFee)}
      </PopoverTrigger>
      <PopoverContent className='flex flex-col text-sm w-fit'>
        <dl className='flex flex-col gap-1'>
          <div className='flex items-center gap-4'>
            <dt className='font-medium min-w-24'>Base Fee:</dt>
            <dd>{formatCurrency(value.baseFee || 0)}</dd>
          </div>
          <div className='flex items-center gap-4'>
            <dt className='font-medium min-w-24'>Tech Fee:</dt>
            <dd>{formatCurrency(value.techFee || 0)}</dd>
          </div>
          <div className='flex items-center gap-4'>
            <dt className='font-medium min-w-24'>Quest. Fee:</dt>
            <dd>{formatCurrency(value.questionnaireFee || 0)}</dd>
          </div>
        </dl>
      </PopoverContent>
    </Popover>
  )
}

export default FeeCell
