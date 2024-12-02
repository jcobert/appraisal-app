import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server'
import { FC } from 'react'

import AuthLink from '@/components/auth/auth-link'
import UserMenu from '@/components/layout/header/user-menu'
import DesktopNav from '@/components/layout/nav/desktop-nav'
import MobileNav from '@/components/layout/nav/mobile-nav'

const Header: FC = async () => {
  const session = getKindeServerSession()

  const { getUser, isAuthenticated, getPermissions } = session

  const user = await getUser()
  const loggedIn = await isAuthenticated()
  const permissions = await getPermissions()

  const sessionData = { loggedIn, permissions, user }

  const navClassName = 'bg-almost-white/90'

  return (
    <>
      {/* Mobile */}
      <MobileNav className={navClassName} sessionData={sessionData} />

      {/* Desktop */}
      <DesktopNav className={navClassName} sessionData={sessionData}>
        <div className='ml-auto flex items-center gap-8'>
          <AuthLink loggedIn={loggedIn} type='register' />
          <UserMenu sessionData={{ loggedIn, permissions, user }} />
        </div>
      </DesktopNav>
    </>
  )
}

export default Header
