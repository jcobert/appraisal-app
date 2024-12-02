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
    >
      <div className='bg-white rounded border p-2 px-4 shadow flex flex-col gap-4 min-w-56'>
        <UserGreeting user={user} />

        <div className='flex flex-col items-center gap-1'>
          {!loggedIn ? (
            <p className='text-balance text-sm mt-2'>
              Already have an account?
            </p>
          ) : null}
          <AuthLink loggedIn={loggedIn} />
        </div>
      </div>
    </Popover>
  )
}

export default UserMenu
