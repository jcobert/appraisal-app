'use client'

import Link from 'next/link'
import { FC } from 'react'

import {
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@repo/ui/ui/sidebar'
import { Skeleton } from '@repo/ui/ui/skeleton'
import { exists } from '@repo/utils'

import { NavItem } from '@/utils/nav'

import { useNavigation } from '@/hooks/use-navigation'

type Props = {
  item: NavItem
  /**
   * Whether permissions are being checked.
   * Item will be in loading state if it has a `hidden` condition and this is `true`.
   */
  authorizing: boolean
  className?: string
}

const SidebarNavItem: FC<Props> = ({ item, authorizing, className }) => {
  const { isActiveItem } = useNavigation()
  const { open, openMobile } = useSidebar()

  const Icon = item?.icon
  if (exists(item?.hidden) && authorizing)
    return (
      <SidebarMenuItem key={item?.id} className={className}>
        <SidebarMenuButton asChild>
          <Skeleton inert />
        </SidebarMenuButton>
      </SidebarMenuItem>
    )
  if (item?.hidden) return null
  return (
    <SidebarMenuItem key={item?.id} className={className}>
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
}

export default SidebarNavItem
