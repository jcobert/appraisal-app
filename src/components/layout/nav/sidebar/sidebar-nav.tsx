'use client'

import * as NavigationMenu from '@radix-ui/react-navigation-menu'
import React, { FC } from 'react'

import { filterProtectedNavItems } from '@/utils/nav'
import { cn } from '@/utils/style'

import NavLink from '@/components/layout/nav/nav-link'

import { usePageSize } from '@/hooks/use-page-size'

import { SessionData } from '@/types/auth'

import { NAVIGATION_ITEMS } from '@/configuration/nav'

type Props = {
  sessionData: Partial<SessionData>
}

const SidebarNav: FC<Props> = ({ sessionData }) => {
  const { loggedIn } = sessionData || {}

  const { usableHeight } = usePageSize()

  const navItems = filterProtectedNavItems(NAVIGATION_ITEMS, loggedIn)

  if (!loggedIn) return null

  return (
    <NavigationMenu.Root style={{ height: usableHeight }}>
      <NavigationMenu.List className='flex flex-col gap-4 py-4'>
        {navItems?.map((item) => {
          // const hasMenu = !!item?.menu?.links?.length
          const Icon = item?.icon

          return (
            <NavigationMenu.Item key={item?.id}>
              <NavLink
                href={item?.url}
                className={cn(
                  'data-[active]:bg-gray-200 data-[active]:text-almost-black data-[active]:cursor-default',
                  'transition select-none rounded-[4px] px-3 py-2 text-[15px] font-medium leading-none no-underline',
                  'hover:bg-gray-100',
                  'flex gap-2 items-center',
                )}
              >
                {/* {item?.icon ? item?.icon : null} */}
                {Icon ? <Icon /> : null}
                {item?.name}
              </NavLink>
            </NavigationMenu.Item>
          )
        })}
      </NavigationMenu.List>
    </NavigationMenu.Root>
  )
}

export default SidebarNav
