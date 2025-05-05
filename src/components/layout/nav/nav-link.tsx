import * as NavigationMenu from '@radix-ui/react-navigation-menu'
import NextLink from 'next/link'
import { FC } from 'react'

import { useNavigationMenu } from '@/hooks/use-navigation'

const NavLink: FC<NavigationMenu.NavigationMenuLinkProps> = ({
  href = '',
  ...props
}) => {
  const { isActivePath } = useNavigationMenu()

  const active = isActivePath(href)

  return (
    <NextLink href={href} passHref legacyBehavior>
      <NavigationMenu.Link
        className='text-brand transition [&:not([data-active])]:hover:bg-brand/80 hover:text-almost-white data-[active]:hover:text-brand-dark block select-none rounded-[4px] px-3 py-2 text-[15px] font-medium leading-none no-underline data-[active]:text-brand data-[active]:rounded-b-none data-[active]:hover:rounded-b-[4px]'
        active={active}
        {...props}
      />
    </NextLink>
  )
}

export default NavLink
