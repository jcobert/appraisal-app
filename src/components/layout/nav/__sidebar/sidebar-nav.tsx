'use client'

import * as NavigationMenu from '@radix-ui/react-navigation-menu'
import React, { FC } from 'react'
import { BsArrowBarLeft, BsArrowBarRight } from 'react-icons/bs'
import { useIsClient } from 'usehooks-ts'

import { filterProtectedNavItems } from '@/utils/nav'
import { cn } from '@/utils/style'

import NavLink from '@/components/layout/nav/nav-link'
import SidebarSkeleton from '@/components/layout/nav/__sidebar/sidebar-skeleton'
import { Button } from '@/components/ui/button'

import { useNavigationMenu } from '@/hooks/use-navigation'
import { usePageSize } from '@/hooks/use-page-size'

import { SessionData } from '@/types/auth'

import { APP_NAVIGATION_ITEMS } from '@/configuration/app-nav'

type Props = {
  sessionData: Partial<SessionData>
}

const SidebarNav: FC<Props> = ({ sessionData }) => {
  const { loggedIn } = sessionData || {}
  const isClient = useIsClient()

  const navItems = filterProtectedNavItems(APP_NAVIGATION_ITEMS, loggedIn)

  const { usableHeight, header } = usePageSize()
  const { isActiveItem, isSidebarExpanded, setIsSidebarExpanded } =
    useNavigationMenu()

  if (!loggedIn || !isClient)
    return <SidebarSkeleton expanded={isSidebarExpanded} />

  return (
    <div
      id='navigation-sidebar'
      style={{ height: usableHeight, top: header?.height }}
      className={cn(
        'sticky overflow-auto flex flex-col',
        'border-r px-1 pb-4 max-md:hidden',
        isSidebarExpanded && 'px-2 xl:px-6',
      )}
    >
      <NavigationMenu.Root>
        <NavigationMenu.List
          className={cn(
            'flex flex-col gap-2 py-4',
            !isSidebarExpanded && 'items-center',
          )}
        >
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
                        'flex-none',
                        !active && [
                          'text-gray-600 group-hover:text-almost-black',
                          'dark:text-gray-300 group-hover:dark:text-almost-white',
                        ],
                        !isSidebarExpanded && 'text-xl',
                      )}
                    />
                  ) : null}
                  {isSidebarExpanded ? item?.name : null}
                </NavLink>
              </NavigationMenu.Item>
            )
          })}
        </NavigationMenu.List>
      </NavigationMenu.Root>

      <Button
        // aria-label={`${isSidebarExpanded ? 'Collapse' : 'Expand'} sidebar`}
        variant='ghost'
        size='icon'
        className={cn('mt-auto mx-auto text-xl', isSidebarExpanded && 'mr-0')}
        onClick={() => {
          // setIsSidebarExpanded((prev) => !prev)
          setIsSidebarExpanded(!isSidebarExpanded)
        }}
      >
        {isSidebarExpanded ? (
          <BsArrowBarLeft aria-label='Collapse sidebar' />
        ) : (
          <BsArrowBarRight aria-label='Expand sidebar' />
        )}
      </Button>
    </div>
  )
}

export default SidebarNav
