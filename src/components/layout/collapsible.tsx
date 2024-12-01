import * as Collapse from '@radix-ui/react-collapsible'
import { FC, ReactNode, useState } from 'react'
import { MdOutlineExpandMore } from 'react-icons/md'

import { cn } from '@/utils/style'

type Props = {
  children?: ReactNode
  header?: ReactNode
  triggerIcon?: ReactNode
  defaultOpen?: boolean
  className?: string
  triggerClassName?: string
}

const Collapsible: FC<Props> = ({
  children,
  header,
  triggerIcon,
  defaultOpen = false,
  className = '',
  triggerClassName = '',
}) => {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <Collapse.Root
      open={open}
      onOpenChange={setOpen}
      className={cn(['flex flex-col gap-1', className])}
    >
      <Collapse.Trigger
        className={cn([
          'flex items-center gap-2 justify-between',
          triggerClassName,
        ])}
      >
        <>
          <h4 className='font-medium'>{header}</h4>
          <div
            className={cn([
              'text-xl transition-transform',
              open && 'rotate-180',
            ])}
          >
            {triggerIcon ?? <MdOutlineExpandMore />}
          </div>
        </>
      </Collapse.Trigger>
      <Collapse.Content className='overflow-hidden data-[state=open]:animate-collapseDown data-[state=closed]:animate-collapseUp'>
        {children}
      </Collapse.Content>
    </Collapse.Root>
  )
}

export default Collapsible
