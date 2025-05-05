import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

import { NavItem } from '@/utils/nav'

export const useNavigationMenu = () => {
  const pathname = usePathname()

  const [isMenuOpen, setIsMenuOpen] = useState(false)

  // Close menu when new page is loaded.
  useEffect(() => {
    setIsMenuOpen(false)
  }, [pathname])

  /**
   * Returns whether provided path is the active path.
   * Dynamic routes are treated as a match.
   *
   * E.g. `"/shop/pants"` (provided path) will match `"/shop/[item]"` (router pathname)
   */
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

  /** Returns whether nav item (or one of it's inner menu links) contains the active path. */
  const isActiveItem = (item: NavItem) => {
    return (
      isActivePath(item?.url) ||
      !!item?.menu?.links?.some((link) => isActivePath(link?.url))
    )
  }

  return { isActiveItem, isActivePath, isMenuOpen, setIsMenuOpen }
}
