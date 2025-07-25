import { ChevronsUpDown, LogOut } from 'lucide-react'
import Link from 'next/link'
import { FC } from 'react'

import { fullName } from '@/utils/string'
import { cn } from '@/utils/style'

import AuthLink from '@/components/auth/auth-link'
import Avatar from '@/components/general/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { SidebarMenuButton, useSidebar } from '@/components/ui/sidebar'

import { SessionData } from '@/types/auth'

import { useGetUserProfile } from '@/features/user/hooks/use-get-user-profile'

type Props = {
  sessionData: Partial<SessionData>
  className?: string
}

const SidebarUserMenu: FC<Props> = ({ sessionData }) => {
  const { loggedIn } = sessionData || {}
  const { response } = useGetUserProfile()

  const profile = response?.data || sessionData?.profile
  const { avatar, email } = profile || {}

  const name = fullName(profile?.firstName, profile?.lastName)

  const { isMobile, open, openMobile } = useSidebar()

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

        {/* <DropdownMenuSeparator /> */}

        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link href='/user/profile'>My Profile</Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>

        {/* <DropdownMenuSeparator /> */}

        {/* <DropdownMenuGroup>
          <DropdownMenuItem>
            <BadgeCheck />
            Account
          </DropdownMenuItem>
          <DropdownMenuItem>
            <CreditCard />
            Billing
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Bell />
            Notifications
          </DropdownMenuItem>
        </DropdownMenuGroup> */}

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
