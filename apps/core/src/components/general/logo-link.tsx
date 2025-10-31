import Link from 'next/link'
import { ComponentPropsWithoutRef, FC } from 'react'

import { cn } from '@repo/utils'

import { homeUrl } from '@/utils/nav'

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
      <Logo className='hover:text-primary/90' />
    </Link>
  )
}

export default LogoLink
