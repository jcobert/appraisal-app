import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useIsClient } from 'usehooks-ts'

import { NavItem } from '@/utils/nav'

import { useStoredSettings } from '@/hooks/use-stored-settings'

export const useNavigationMenu = () => {
  const pathname = usePathname()
  const { settings, updateSettings } = useStoredSettings()
  const isClient = useIsClient()

  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const isSidebarExpanded = isClient ? settings?.sidebarExpanded : true
  const setIsSidebarExpanded = (expanded: boolean) => {
    updateSettings({ ...settings, sidebarExpanded: expanded })
  }

  // Close menu when new page is loaded.
  useEffect(() => {
    setIsMenuOpen(false)
  }, [pathname])

  const isActivePath = (path?: string) => {
    if (path === '/') return path === pathname

    const activePath = pathname

    // Filter out any dynamic routes, and focus only on base path.
    const dynamicRouteIndex = activePath?.indexOf('[')
    const staticPath = activePath?.slice(
      0,
      dynamicRouteIndex > 0 ? dynamicRouteIndex - 1 : undefined,
    )

    const pathParts = path?.split('/')?.filter((i) => i) || []
    const activePathParts = staticPath?.split('/')?.filter((i) => i) || []

    // Check if base path is a match.
    const isDynamicMatch =
      !!activePathParts?.length &&
      activePathParts?.map((p, i) => pathParts?.[i] === p)?.every(Boolean)

    return (!!path && staticPath?.startsWith(path)) || isDynamicMatch
  }

  const isActiveItem = (item: NavItem) => {
    return (
      isActivePath(item?.url) ||
      !!item?.menu?.links?.some((link) => isActivePath(link?.url))
    )
  }

  return {
    /** Returns whether nav item (or one of it's inner menu links) contains the active path. */
    isActiveItem,
    /**
     * Returns whether provided path is the active path.
     * Dynamic routes are treated as a match.
     *
     * E.g. `"/shop/pants"` (provided path) will match `"/shop/[item]"` (router pathname)
     */
    isActivePath,
    isMenuOpen,
    setIsMenuOpen,
    isSidebarExpanded,
    setIsSidebarExpanded,
  }
}
