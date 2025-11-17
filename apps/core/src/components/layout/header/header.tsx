import { FC } from 'react'

import DesktopNav from '@/components/layout/site-nav/desktop-nav'
import MobileNav from '@/components/layout/site-nav/mobile-nav'

const Header: FC = async () => {
  const navClassName = 'bg-almost-white/90 dark:bg-almost-black/90 transition'

  return (
    <>
      {/* Mobile */}
      <MobileNav className={navClassName} sessionData={{}} />

      {/* Desktop */}
      <DesktopNav className={navClassName} sessionData={{}} />
    </>
  )
}

export default Header
