import { FC } from 'react'
import { FaRegCircleUser } from 'react-icons/fa6'

import AuthLink from '@/components/auth/auth-link'
import UserGreeting from '@/components/layout/header/user-greeting'
import Popover from '@/components/layout/popover'

import { SessionData } from '@/types/auth'

const UserMenu: FC<{ sessionData: SessionData }> = ({
  sessionData: { user, loggedIn },
}) => {
  return (
    <Popover
      trigger={<FaRegCircleUser />}
      triggerProps={{
        className: 'text-brand hover:text-brand-dark transition text-2xl',
      }}
      contentProps={{ collisionPadding: 5 }}
    >
      <div className='bg-white rounded border p-4 shadow flex flex-col gap-4 min-w-60'>
        <UserGreeting user={user} />

        <div className='flex flex-col items-center gap-1'>
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
    </Popover>
  )
}

export default UserMenu
