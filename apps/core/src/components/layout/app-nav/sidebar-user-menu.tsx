'use client'

import { Check, ChevronsUpDown, LogOut } from 'lucide-react'
import { useTheme } from 'next-themes'
import Link from 'next/link'
import { FC } from 'react'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  SidebarMenuButton,
  useSidebar,
} from '@repo/ui'
import { cn, fullName, objectKeys } from '@repo/utils'

import { Theme, getThemeIcon } from '@/providers/theme-provider'

import AuthLink from '@/components/auth/auth-link'
import Avatar from '@/components/general/avatar'

import { SessionData } from '@/types/auth'

import { useGetUserProfile } from '@/features/user/hooks/use-get-user-profile'

type Props = {
  sessionData: Partial<SessionData>
  className?: string
}

const SidebarUserMenu: FC<Props> = ({ sessionData }) => {
  const { loggedIn } = sessionData || {}
  const { response } = useGetUserProfile({ options: { enabled: true } })

  const profile = response?.data
  const { avatar, email } = profile || {}

  const name = fullName(profile?.firstName, profile?.lastName)

  const { isMobile, open, openMobile } = useSidebar()

  const { setTheme, theme } = useTheme()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <SidebarMenuButton
          size='lg'
          className={cn(
            'data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground',
            'group/user-menu-trigger',
            !open && !openMobile && 'rounded-lg',
          )}
        >
          <Avatar
            image={avatar}
            name={name}
            alt={name}
            // size={open ? 'md' : 'sm'}
            size='sm'
            className={cn(
              'rounded-lg',
              // 'border',
              // 'transition-[width,height]',
            )}
            fallbackClassName={cn(
              'rounded-lg border',
              !open &&
                !openMobile &&
                'group-hover/user-menu-trigger:bg-background/50 transition',
            )}
          />
          <div className='flex flex-col flex-1 text-left text-sm leading-tight'>
            <span className='truncate font-medium'>{name}</span>
            <span className='truncate text-xs'>{email}</span>
          </div>
          <ChevronsUpDown className='ml-auto size-4' />
        </SidebarMenuButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className='w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg'
        side={isMobile ? 'bottom' : 'right'}
        align='end'
        sideOffset={4}
      >
        <DropdownMenuLabel className='p-0 font-normal'>
          <div className='flex items-center gap-2 px-1 py-1.5 text-left text-sm'>
            <Avatar
              image={avatar}
              name={name}
              alt={name}
              size='sm'
              className={cn(
                'rounded-lg',
                // 'border',
                // 'transition-[width,height]',
              )}
              fallbackClassName='border rounded-lg'
            />
            <div className='grid flex-1 text-left text-sm leading-tight'>
              <span className='truncate font-medium'>{name}</span>
              <span className='truncate text-xs'>{email}</span>
            </div>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link href='/user/profile'>My Profile</Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        {/* <DropdownMenuSub>
          <DropdownMenuSubTrigger></DropdownMenuSubTrigger>
          <DropdownMenuPortal>
            <DropdownMenuSubContent>
              <DropdownMenuItem></DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuPortal>
        </DropdownMenuSub> */}

        <DropdownMenuGroup>
          <DropdownMenuLabel className='text-muted-foreground text-xs'>
            Theme
          </DropdownMenuLabel>
          {objectKeys(Theme)?.map((t) => {
            const isActive = t === theme
            const Icon = getThemeIcon(t)
            return (
              <DropdownMenuItem
                key={t}
                onClick={() => setTheme(t)}
                className='flex items-center'
              >
                <Icon />
                <span className='capitalize flex-1'>{t}</span>

                {isActive ? <Check className='text-primary' /> : null}
              </DropdownMenuItem>
            )
          })}
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuItem asChild>
          <AuthLink loggedIn={loggedIn} type='logout'>
            <LogOut />
            Sign out
          </AuthLink>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default SidebarUserMenu
