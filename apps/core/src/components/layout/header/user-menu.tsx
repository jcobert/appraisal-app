'use client'

import Link from 'next/link'
import { FC, useState } from 'react'
import { FaRegCircleUser } from 'react-icons/fa6'

import { Button, Popover, PopoverContent, PopoverTrigger } from '@repo/ui'
import { cn } from '@repo/utils'

import AuthLink from '@/components/auth/auth-link'
import UserGreeting from '@/components/layout/header/user-greeting'

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
                  <Button>
                    <AuthLink
                      loggedIn={loggedIn}
                      type='register'
                      className='self-center w-full'
                    />
                  </Button>
                </div>
                <div className='flex flex-col items-center'>
                  <p className='text-balance text-sm'>
                    Already have an account?
                  </p>
                  <Button asChild variant='ghost'>
                    <AuthLink loggedIn={loggedIn} type='login' />
                  </Button>
                </div>
              </div>
            ) : null}
            {loggedIn ? (
              <Button asChild variant='ghost'>
                <AuthLink loggedIn={loggedIn} type='logout' />
              </Button>
            ) : null}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

export default UserMenu
