'use client'

import Link from 'next/link'
import { FC, useState } from 'react'
import { FaRegCircleUser } from 'react-icons/fa6'

import { cn } from '@/utils/style'

import AuthLink from '@/components/auth/auth-link'
import ThemeSelector from '@/components/general/theme-selector'
import UserGreeting from '@/components/layout/header/user-greeting'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

import { SessionData } from '@/types/auth'

const UserMenu: FC<{ sessionData: SessionData }> = ({
  sessionData: { profile, loggedIn },
}) => {
  const [open, setOpen] = useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant='minimal' size='icon' className='rounded-full__'>
          <FaRegCircleUser className='text-2xl' />
        </Button>
      </PopoverTrigger>
      <PopoverContent>
        <div className='flex flex-col gap-4 min-w-60'>
          <div className='flex items-center justify-between gap-6'>
            {loggedIn ? (
              <Link
                href='/user/profile'
                onClick={() => {
                  setOpen(false)
                }}
                className='group'
              >
                <UserGreeting user={profile} />
              </Link>
            ) : null}
          </div>

          <ThemeSelector className='self-center' />

          <div
            className={cn(
              'flex flex-col items-center gap-1',
              loggedIn && 'border-t dark:border-gray-700 pt-2',
            )}
          >
            {!loggedIn ? (
              <div className='flex flex-col gap-12'>
                <div className='flex flex-col items-center gap-2'>
                  <p className='text-balance'>Ready to get started?</p>
                  <AuthLink
                    loggedIn={loggedIn}
                    type='register'
                    className='self-center w-full'
                  />
                </div>
                <div className='flex flex-col items-center'>
                  <p className='text-balance text-sm'>
                    Already have an account?
                  </p>
                  <AuthLink loggedIn={loggedIn} type='login' />
                </div>
              </div>
            ) : null}
            {loggedIn ? <AuthLink loggedIn={loggedIn} type='logout' /> : null}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

export default UserMenu
