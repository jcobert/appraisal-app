import { HTMLProps } from 'react'

export type NavLink = {
  id: string
  name: string
  url: string
  description?: string
}

export type NavMenu = { links: NavLink[]; img?: HTMLProps<HTMLImageElement> }

export type NavItem = NavLink & { menu?: NavMenu }

export const isActive = (link: NavLink, pathname: string) =>
  link?.url === pathname

export const getRowSpan = (menu: NavMenu) => {
  return `row-span-${menu?.links?.length ?? 3}`
}

export const navItems: NavItem[] = []
