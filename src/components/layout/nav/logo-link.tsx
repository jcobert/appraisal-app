import Link, { LinkProps } from 'next/link'
import { FC } from 'react'

import { cn } from '@/utils/style'

import Logo from '@/components/general/logo'

import { SessionData } from '@/types/auth'

import { homeUrl } from '@/configuration/nav'

type Props = Partial<LinkProps> &
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
