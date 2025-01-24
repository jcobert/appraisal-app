import * as Dropdown from '@radix-ui/react-dropdown-menu'
import { FC, ReactNode } from 'react'
import { SlOptionsVertical } from 'react-icons/sl'

import { cn } from '@/utils/style'

import Button from '@/components/general/button'

export const DropdownMenuItem: FC<Dropdown.DropdownMenuItemProps> = ({
  children,
  className,
  ...props
}) => {
  return (
    <Dropdown.Item
      className={cn(
        'text-brand cursor-default font-medium rounded pl-4 pr-2 py-px data-[highlighted]:text-almost-white flex items-center gap-2 select-none data-[highlighted]:bg-brand outline-none',
        className,
      )}
      {...props}
    >
      {children}
    </Dropdown.Item>
  )
}

type Props = { trigger?: ReactNode; children?: ReactNode }

const DropdownMenu: FC<Props> = ({ children, trigger }) => {
  return (
    <Dropdown.Root>
      <Dropdown.Trigger asChild>
        {trigger ?? (
          <Button variant='tertiary' className='p-2 min-w-0 w-fit'>
            <SlOptionsVertical className='text-lg' />
          </Button>
        )}
      </Dropdown.Trigger>

      <Dropdown.Portal>
        <Dropdown.Content
          sideOffset={2}
          collisionPadding={5}
          className='border bg-almost-white shadow rounded min-h-4 min-w-48 p-1'
        >
          {children}
          <Dropdown.Arrow className='fill-almost-white' />
        </Dropdown.Content>
      </Dropdown.Portal>
    </Dropdown.Root>
  )
}

export default DropdownMenu
