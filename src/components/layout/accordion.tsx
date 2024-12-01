'use client'

import * as Radix from '@radix-ui/react-accordion'
import { FC, ReactNode } from 'react'
import { MdOutlineExpandMore } from 'react-icons/md'

import { cn } from '@/utils/style'

type Props = {
  items?: { header?: ReactNode; content?: ReactNode }[]
  className?: string
  triggerClassName?: string
  itemClassName?: string
  defaultOpen?: number[] | boolean
  type?:
    | Radix.AccordionSingleProps['type']
    | Radix.AccordionMultipleProps['type']
  collapsible?: Radix.AccordionSingleProps['collapsible']
}

const Accordion: FC<Props> = ({
  items = [],
  className = '',
  triggerClassName = '',
  itemClassName = '',
  defaultOpen = [],
  ...props
}) => {
  const isSingleType = props?.type === 'single' || !props?.type

  let open = ['']
  if (Array.isArray(defaultOpen)) {
    open = defaultOpen?.map((item) => `item-${item}`)
  } else if (defaultOpen) {
    open = items?.map((_, i) => `item-${i + 1}`)
  }

  const radixProps = isSingleType
    ? {
        collapsible: props?.collapsible,
        type: 'single' as const,
        defaultValue: open?.[0] ?? '',
      }
    : { type: 'multiple' as const, defaultValue: open }
  return (
    <Radix.Root
      {...radixProps}
      className={cn(['border rounded-md divide-y', className])}
    >
      {items
        // Only render accordion sections that have content
        ?.filter((itm) => !!itm?.content)
        ?.map((item, i) => (
          <Radix.Item key={i} value={`item-${i + 1}`} className={itemClassName}>
            <Radix.Header className='data-[state=open]:border-b border-gray-100'>
              <Radix.Trigger
                className={cn([
                  'flex w-full items-center justify-between rounded-md gap-2 max-sm:py-2 group font-medium text-lg p-2 bg-almost-white hover:bg-gray-50 data-[state=open]:hover:rounded-b-none transition-all',
                  triggerClassName,
                ])}
              >
                <>
                  {item?.header}
                  <MdOutlineExpandMore className='text-xl transition-transform duration-300 group-data-[state=open]:rotate-180' />
                </>
              </Radix.Trigger>
            </Radix.Header>
            <Radix.Content className='overflow-hidden rounded-b-md bg-almost-white mt-2__ data-[state=open]:animate-accordionDown data-[state=closed]:animate-accordionUp'>
              {item?.content}
            </Radix.Content>
          </Radix.Item>
        ))}
    </Radix.Root>
  )
}

export default Accordion
