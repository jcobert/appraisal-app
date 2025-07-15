'use client'

import Link from 'next/link'
import { FC } from 'react'

import { filterProtectedNavItems } from '@/utils/nav'

import OrganizationSelector from '@/components/layout/sidebar/organization-selector'
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
  SidebarRail,
  useSidebar,
} from '@/components/ui/sidebar'

import { usePageSize } from '@/hooks/use-page-size'

import { SessionData } from '@/types/auth'

import { APP_NAVIGATION_ITEMS } from '@/configuration/app-nav'

type Props = {
  sessionData: Partial<SessionData>
}

const AppSidebarCore: FC<Props> = ({
  sessionData: { loggedIn, organizations },
}) => {
  const navItems = filterProtectedNavItems(APP_NAVIGATION_ITEMS, loggedIn)

  const { usableHeight, header } = usePageSize()
  const { open } = useSidebar()

  return (
    <Sidebar
      style={{ height: usableHeight, top: header?.height }}
      collapsible='icon'
    >
      <SidebarHeader>
        <OrganizationSelector organizations={organizations} compact={!open} />
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Organization</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems?.map((item) => {
                const Icon = item?.icon
                return (
                  <SidebarMenuItem key={item?.id}>
                    <SidebarMenuButton asChild>
                      <Link href={item?.url}>
                        {Icon ? <Icon /> : null}
                        {open ? item?.name : null}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter></SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}

export default AppSidebarCore
