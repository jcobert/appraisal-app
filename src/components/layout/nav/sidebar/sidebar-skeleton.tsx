import { FC } from 'react'

import { filterProtectedNavItems } from '@/utils/nav'
import { cn } from '@/utils/style'

import FullScreenLoader from '@/components/layout/full-screen-loader'

import { NAVIGATION_ITEMS } from '@/configuration/app-nav'

type Props = {
  expanded?: boolean
}

const navItems = filterProtectedNavItems(NAVIGATION_ITEMS, true)

const SidebarSkeleton: FC<Props> = ({ expanded }) => {
  return (
    <div
      className={cn(
        'h-[calc(100vh-60px)] border-r max-md:hidden',
        'flex flex-col gap-2 items-center',
        'py-4',
        expanded ? 'w-[161px] xl:w-[193px]' : 'w-[53px]',
      )}
    >
      <FullScreenLoader />
      {navItems?.map((item) => (
        <div
          key={item?.id}
          className={cn(
            'rounded bg-gray-200 animate-pulse',
            expanded ? 'w-36 h-8' : 'w-11 h-9',
          )}
        />
      ))}
    </div>
  )
}

export default SidebarSkeleton
