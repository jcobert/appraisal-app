import Link from 'next/link'
import { ComponentPropsWithoutRef, FC } from 'react'

import { homeUrl } from '@/utils/nav'
import { cn } from '@/utils/style'

import Logo from '@/components/general/logo'

import { SessionData } from '@/types/auth'

type Props = Partial<ComponentPropsWithoutRef<typeof Link>> &
  Pick<SessionData, 'loggedIn'> & {
    className?: string
  }

const LogoLink: FC<Props> = ({ loggedIn, className, href, ...props }) => {
  const url = href || homeUrl(loggedIn)
  return (
    <Link href={url} {...props} className={cn('w-fit', className)}>
      <Logo />
    </Link>
  )
}

export default LogoLink
