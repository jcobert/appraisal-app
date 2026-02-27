import { CustomCellRendererProps } from 'ag-grid-react'
import { CheckIcon, LucideProps, MinusIcon, PercentIcon } from 'lucide-react'
import { FC, ForwardRefExoticComponent, RefAttributes } from 'react'

import { Tooltip, TooltipContent, TooltipTrigger } from '@repo/ui'
import { cn } from '@repo/utils'

import { OrdersTableData } from '@/features/orders/orders-table'
import { PAYMENT_STATUS_LABEL } from '@/features/orders/types'

// const getVariant = (
//   value: OrdersTableData['paymentStatus'] | undefined,
// ): BadgeProps['variant'] => {
//   switch (value) {
//     case 'paid':
//       return 'success'
//     case 'partial':
//       return 'warning'
//     case 'unpaid':
//       return 'failure'
//     default:
//       return 'neutral'
//   }
// }

type LucideIconComponent = ForwardRefExoticComponent<
  Omit<LucideProps, 'ref'> & RefAttributes<SVGSVGElement>
>

const Icon: FC<{
  value: OrdersTableData['paymentStatus'] | undefined
}> = ({ value }) => {
  let Comp: LucideIconComponent | keyof HTMLElementTagNameMap = 'div'
  switch (value) {
    case 'paid':
      Comp = CheckIcon
      break
    case 'partial':
      Comp = PercentIcon
      break
    case 'unpaid':
      Comp = MinusIcon
      break
  }
  return (
    <Comp
      className={cn(
        'size-4',
        value === 'paid' && 'text-emerald-500',
        value === 'partial' && 'text-gray-500',
        value === 'unpaid' && 'text-gray-500',
      )}
    />
  )
}

const PaymentStatusCell = ({
  value,
  valueFormatted,
}: CustomCellRendererProps<
  OrdersTableData,
  OrdersTableData['paymentStatus']
>) => {
  const fallbackFormatted = value ? PAYMENT_STATUS_LABEL?.[value] : ''
  const label = valueFormatted || fallbackFormatted

  // const variant = getVariant(value)

  return (
    <Tooltip>
      <span className='sr-only'>{label}</span>
      <div aria-hidden className='flex items-center h-full w-fit'>
        <TooltipTrigger>
          <Icon value={value} />
        </TooltipTrigger>
      </div>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )

  // return (
  //   <Badge variant={variant} className='whitespace-nowrap'>
  //     {label}
  //   </Badge>
  // )
}

export default PaymentStatusCell
