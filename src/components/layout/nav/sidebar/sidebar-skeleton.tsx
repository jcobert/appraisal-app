import { FC } from 'react'

import { filterProtectedNavItems } from '@/utils/nav'
import { cn } from '@/utils/style'

import { NAVIGATION_ITEMS } from '@/configuration/nav'

type Props = {
  //
}

const navItems = filterProtectedNavItems(NAVIGATION_ITEMS, true)

const SidebarSkeleton: FC<Props> = () => {
  return (
    <div
      className={cn(
        'h-[calc(100vh-60px)] w-[53px] border-r max-md:hidden',
        'flex flex-col gap-2 items-center',
        'py-4',
      )}
    >
      {navItems?.map((item) => (
        <div
          key={item?.id}
          className='w-11 h-9 rounded bg-gray-200 animate-pulse'
        />
      ))}
    </div>
  )
}

export default SidebarSkeleton
