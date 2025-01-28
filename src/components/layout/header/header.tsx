import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server'
import { FC } from 'react'

import { getActiveUserProfile } from '@/lib/db/operations/user'

import { filterProtectedNavItems } from '@/utils/nav'

import AuthLink from '@/components/auth/auth-link'
import UserMenu from '@/components/layout/header/user-menu'
import DesktopNav from '@/components/layout/nav/desktop-nav'
import MobileNav from '@/components/layout/nav/mobile-nav'

import { SessionData } from '@/types/auth'

import { NAVIGATION_ITEMS } from '@/configuration/nav'

const Header: FC = async () => {
  const session = getKindeServerSession()

  const { getUser, isAuthenticated, getPermissions } = session

  const user = await getUser()
  const loggedIn = await isAuthenticated()
  const permissions = await getPermissions()
  const profile = await getActiveUserProfile()

  const sessionData = {
    loggedIn,
    permissions,
    user,
    profile,
  } satisfies SessionData

  const navClassName = 'bg-almost-white/90'

  const navItems = filterProtectedNavItems(NAVIGATION_ITEMS, loggedIn)

  return (
    <>
      {/* Mobile */}
      <MobileNav
        className={navClassName}
        sessionData={sessionData}
        navItems={navItems}
      />

      {/* Desktop */}
      <DesktopNav
        className={navClassName}
        sessionData={sessionData}
        navItems={navItems}
      >
        <div className='ml-auto flex items-center gap-8'>
          {!loggedIn ? <AuthLink loggedIn={loggedIn} type='register' /> : null}
          <UserMenu sessionData={sessionData} />
        </div>
      </DesktopNav>
    </>
  )
}

export default Header
