'use client'

import { LayoutDashboard, Settings } from 'lucide-react'
import { FC, useMemo } from 'react'

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarSeparator,
} from '@repo/ui/ui/sidebar'

import { cn } from '@/lib/utils'

import { NavItem } from '@/utils/nav'

import { useOrganizationContext } from '@/providers/organization-provider'

import SidebarNavItem from '@/components/layout/app-nav/sidebar-nav-item'
import SidebarOrgSelector from '@/components/layout/app-nav/sidebar-org-selector'
import SidebarUserMenu from '@/components/layout/app-nav/sidebar-user-menu'

import { SessionData } from '@/types/auth'

type Props = {
  sessionData: Partial<SessionData>
}

const AppSidebarCore: FC<Props> = ({ sessionData }) => {
  const { organizations } = sessionData || {}

  const {
    activeOrgId,
    permissions: { can, isLoading: isLoadingPermissions },
  } = useOrganizationContext()

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
        hidden: !can('edit_org_info'),
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
  }, [activeOrgId, can])

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
                return (
                  <SidebarNavItem
                    key={item?.id}
                    item={item}
                    authorizing={isLoadingPermissions}
                  />
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

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
