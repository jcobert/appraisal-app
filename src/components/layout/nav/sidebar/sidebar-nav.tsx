'use client'

import * as NavigationMenu from '@radix-ui/react-navigation-menu'
import React, { FC } from 'react'

import { filterProtectedNavItems } from '@/utils/nav'
import { cn } from '@/utils/style'

import NavLink from '@/components/layout/nav/nav-link'

import { useNavigationMenu } from '@/hooks/use-navigation'
import { usePageSize } from '@/hooks/use-page-size'

import { SessionData } from '@/types/auth'

import { NAVIGATION_ITEMS } from '@/configuration/nav'

type Props = {
  sessionData: Partial<SessionData>
}

const SidebarNav: FC<Props> = ({ sessionData }) => {
  const { loggedIn } = sessionData || {}

  const navItems = filterProtectedNavItems(NAVIGATION_ITEMS, loggedIn)

  const { usableHeight, header } = usePageSize()
  const { isActiveItem } = useNavigationMenu()

  if (!loggedIn) return null

  return (
    <NavigationMenu.Root
      style={{ height: usableHeight, top: header?.height }}
      className='sticky overflow-auto px-2'
    >
      <NavigationMenu.List className='flex flex-col gap-2 py-4'>
        {navItems?.map((item) => {
          const active = isActiveItem(item)
          // const hasMenu = !!item?.menu?.links?.length
          const Icon = item?.icon

          return (
            <NavigationMenu.Item key={item?.id}>
              <NavLink
                href={item?.url}
                className={cn(
                  'group',
                  'transition select-none rounded-[4px] px-3 py-2 text-[15px] font-medium leading-none no-underline',
                  'flex gap-2 items-center',
                  active && [
                    'data-[active]:bg-gray-200 data-[active]:text-almost-black data-[active]:cursor-default',
                  ],
                  !active && ['hover:bg-gray-100', 'hover:dark:bg-gray-700'],
                )}
              >
                {Icon ? (
                  <Icon
                    className={cn(
                      !active && [
                        'text-gray-600 group-hover:text-almost-black',
                        'dark:text-gray-300 group-hover:dark:text-almost-white',
                      ],
                    )}
                  />
                ) : null}
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
