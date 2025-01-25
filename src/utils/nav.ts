import { HTMLProps, ReactNode } from 'react'

export type NavLink = {
  id: string
  name: ReactNode
  url: string
  /** Whether route is protected by authentication. */
  protected: boolean
  description?: string
  hidden?: boolean
}

export type NavMenu = {
  links: NavLink[]
  img?: HTMLProps<HTMLImageElement>
}

export type NavItem = NavLink & { menu?: NavMenu }

export const isActive = (link: NavLink, pathname: string) =>
  link?.url === pathname

export const homeUrl = (loggedIn: boolean) => {
  return loggedIn ? '/dashboard' : '/'
}

/** Filters out protected nav items if not authenticated. */
export const filterProtectedNavItems = (
  items: NavItem[],
  authenticated: boolean = false,
) => {
  const openItems = items
    ?.filter((item) => !item?.protected)
    ?.map((item) => {
      if (!item?.menu?.links?.length) return item
      return {
        ...item,
        menu: {
          ...item?.menu,
          links: filterProtectedNavItems(item?.menu?.links),
        },
      } satisfies NavItem
    }) as typeof items
  return authenticated ? items : openItems
}
