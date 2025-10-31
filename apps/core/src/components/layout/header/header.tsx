import { FC } from 'react'

import { Button } from '@repo/ui'

import { getSessionData } from '@/lib/db/utils'

import AuthLink from '@/components/auth/auth-link'
import UserMenu from '@/components/layout/header/user-menu'
import DesktopNav from '@/components/layout/site-nav/desktop-nav'
import MobileNav from '@/components/layout/site-nav/mobile-nav'

const Header: FC = async () => {
  const sessionData = await getSessionData()
  const { loggedIn } = sessionData

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
