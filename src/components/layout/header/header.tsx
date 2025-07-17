import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server'
import { FC } from 'react'

import { getActiveUserProfile } from '@/lib/db/queries/user'

import AuthLink from '@/components/auth/auth-link'
import UserMenu from '@/components/layout/header/user-menu'
import DesktopNav from '@/components/layout/nav/desktop-nav'
import MobileNav from '@/components/layout/nav/mobile-nav'
import { Button } from '@/components/ui/button'

import { SessionData } from '@/types/auth'

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

  const navClassName = 'bg-almost-white/90 dark:bg-almost-black/90 transition'

  // const navItems = filterProtectedNavItems(NAVIGATION_ITEMS, loggedIn)

  return (
    <>
      {/* Mobile */}
      <MobileNav
        className={navClassName}
        sessionData={sessionData}
        // navItems={navItems}
      />

      {/* Desktop */}
      <DesktopNav
        className={navClassName}
        sessionData={sessionData}
        // navItems={loggedIn ? [] : navItems}
      >
        <div className='ml-auto flex items-center gap-8'>
          {!loggedIn ? (
            <Button asChild>
              <AuthLink loggedIn={loggedIn} type='register' />
            </Button>
          ) : null}
          <UserMenu sessionData={sessionData} />
        </div>
      </DesktopNav>
    </>
  )
}

export default Header
