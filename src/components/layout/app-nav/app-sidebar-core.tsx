'use client'

import Link from 'next/link'
import { FC } from 'react'

import { cn } from '@/lib/utils'

import { filterProtectedNavItems } from '@/utils/nav'

import ThemeSelector from '@/components/general/theme-selector'
import SidebarOrgSelector from '@/components/layout/app-nav/sidebar-org-selector'
import SidebarUserMenu from '@/components/layout/app-nav/sidebar-user-menu'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  useSidebar,
} from '@/components/ui/sidebar'

import { useNavigationMenu } from '@/hooks/use-navigation'

import { SessionData } from '@/types/auth'

import { APP_NAVIGATION_ITEMS } from '@/configuration/app-nav'

type Props = {
  sessionData: Partial<SessionData>
}

const AppSidebarCore: FC<Props> = ({ sessionData }) => {
  const { loggedIn, organizations } = sessionData || {}

  const navItems = filterProtectedNavItems(APP_NAVIGATION_ITEMS, !!loggedIn)

  const { open, openMobile } = useSidebar()
  const { isActiveItem } = useNavigationMenu()

  return (
    <Sidebar
      collapsible='icon'
      className='top-[var(--header-height)] h-full overflow-y-auto max-h-[calc(100svh-var(--header-height))]'
    >
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarOrgSelector organizations={organizations} />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className='h-full overflow-y-auto min-h-28'>
        <SidebarGroup
          className={cn('h-full overflow-y-auto', 'overflow-x-hidden')}
        >
          <SidebarGroupLabel>Organization</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems?.map((item) => {
                const Icon = item?.icon
                return (
                  <SidebarMenuItem key={item?.id}>
                    <SidebarMenuButton
                      asChild
                      tooltip={item?.name}
                      isActive={isActiveItem(item)}
                    >
                      <Link href={item?.url}>
                        {Icon ? <Icon /> : null}
                        {open || openMobile ? item?.name : null}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarMenu>
        <SidebarGroup>
          <SidebarMenuItem>
            <ThemeSelector />
          </SidebarMenuItem>
        </SidebarGroup>
      </SidebarMenu>

      <SidebarSeparator />

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarUserMenu sessionData={sessionData} />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      {/* <SidebarRail /> */}
    </Sidebar>
  )
}

export default AppSidebarCore
