'use client'

import { LayoutDashboard, Settings } from 'lucide-react'
import Link from 'next/link'
import { FC, useMemo } from 'react'
import { useIsClient } from 'usehooks-ts'

import { cn } from '@/lib/utils'

import { NavItem } from '@/utils/nav'

import { useOrganizationContext } from '@/providers/organization-provider'

import ThemeSelector from '@/components/general/theme-selector'
import SidebarOrgSelector from '@/components/layout/app-nav/sidebar-org-selector'
import SidebarUserMenu from '@/components/layout/app-nav/sidebar-user-menu'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  useSidebar,
} from '@/components/ui/sidebar'
import { Skeleton } from '@/components/ui/skeleton'

import { useNavigationMenu } from '@/hooks/use-navigation'

import { SessionData } from '@/types/auth'

type Props = {
  sessionData: Partial<SessionData>
}

const AppSidebarCore: FC<Props> = ({ sessionData }) => {
  const { organizations } = sessionData || {}

  const isClient = useIsClient()
  const { open, openMobile } = useSidebar()
  const { isActiveItem } = useNavigationMenu()
  const { activeOrgId } = useOrganizationContext()

  const navItems = useMemo<NavItem[]>(() => {
    return [
      {
        id: 'dashboard',
        name: 'Dashboard',
        url: '/dashboard',
        icon: LayoutDashboard,
      },
      {
        id: 'orgSettings',
        name: 'Settings',
        url: `/organizations/${activeOrgId}/settings`,
        icon: Settings,
      },
      // {
      //   id: 'orders',
      //   name: 'Orders',
      //   url: `/organizations/${activeOrgId}/orders`,
      //   icon: ClipboardList,
      // },
      // {
      //   id: 'clients',
      //   name: 'Clients',
      //   url: `/organizations/${activeOrgId}/clients`,
      //   icon: BookUser,
      // },
    ]
  }, [activeOrgId])

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
          {/* <SidebarGroupLabel>Organization</SidebarGroupLabel> */}
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems?.map((item) => {
                const Icon = item?.icon
                return (
                  <SidebarMenuItem key={item?.id}>
                    {isClient ? (
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
                    ) : (
                      <SidebarMenuButton asChild>
                        <Skeleton />
                      </SidebarMenuButton>
                    )}
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
