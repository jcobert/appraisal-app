import { HTMLProps, ReactNode } from 'react'

export type NavLink = {
  id: string
  name: ReactNode
  url: string
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

export const getRowSpan = (menu: NavMenu) => {
  return `row-span-${menu?.links?.length ?? 3}`
}

export const homeUrl = (loggedIn: boolean) => {
  return loggedIn ? '/dashboard' : '/'
}

export const navItems: NavItem[] = [
  { id: 'appraisers', name: 'Appraisers', url: '/appraisers' },
]
