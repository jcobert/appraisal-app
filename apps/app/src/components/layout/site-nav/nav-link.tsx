import * as NavigationMenu from '@radix-ui/react-navigation-menu'
import NextLink from 'next/link'
import { FC } from 'react'

import { useNavigation } from '@/hooks/use-navigation'

const NavLink: FC<NavigationMenu.NavigationMenuLinkProps> = ({
  href = '',
  children,
  ...props
}) => {
  const { isActivePath } = useNavigation()

  const active = isActivePath(href)

  return (
    <NavigationMenu.Link
      className='text-primary transition [&:not([data-active])]:hover:bg-primary/80 hover:text-almost-white data-[active]:hover:text-primary/90 block select-none rounded-[4px] px-3 py-2 text-[15px] font-medium leading-none no-underline data-[active]:text-primary data-[active]:rounded-b-none data-[active]:hover:rounded-b-[4px]'
      active={active}
      asChild
      {...props}
    >
      <NextLink href={href}>{children}</NextLink>
    </NavigationMenu.Link>
  )
}

export default NavLink
