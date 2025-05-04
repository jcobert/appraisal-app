'use client'

import * as Radix from '@radix-ui/react-popover'
import { FC, ReactNode } from 'react'

import { cn } from '@/utils/style'

type Props = {
  children?: ReactNode
  trigger?: ReactNode
  triggerProps?: Radix.PopoverTriggerProps
  contentProps?: Radix.PopoverContentProps
} & Pick<Radix.PopoverProps, 'open' | 'onOpenChange'>

const Popover: FC<Props> = ({
  children,
  trigger,
  triggerProps,
  contentProps,
  open,
  onOpenChange,
}) => {
  return (
    <Radix.Root open={open} onOpenChange={onOpenChange}>
      <Radix.Trigger {...triggerProps}>{trigger}</Radix.Trigger>
      <Radix.Content
        sideOffset={5}
        {...contentProps}
        className={cn(
          'bg-white rounded border dark:border-gray-500 p-4 shadow dark:bg-black',
          contentProps?.className,
        )}
      >
        {children}
        <Radix.Arrow className='fill-gray-200' />
      </Radix.Content>
    </Radix.Root>
  )
}

export default Popover
