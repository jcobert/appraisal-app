import { FC } from 'react'
import { FaCircleUser } from 'react-icons/fa6'

import { SessionData } from '@/types/auth'

export const UserGreeting: FC<{ user: SessionData['user'] }> = ({ user }) => {
  if (!user) return null

  return (
    <div className='flex items-center justify-center mx-auto w-fit gap-2'>
      <div className='my-auto transition-all rounded-full size-8 border'>
        {user?.picture ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user?.picture}
            alt='user avatar'
            className='object-scale-down object-center rounded-full'
          />
        ) : (
          <FaCircleUser className='text-xl text-medium-gray min-w-full size-8' />
        )}
      </div>
      <div className='flex flex-col'>
        {user?.given_name ? (
          <div className='font-medium font-display'>Hi, {user?.given_name}</div>
        ) : null}
        {user?.email ? (
          <div className='-mt-1 text-xs text-medium-gray'>{user?.email}</div>
        ) : null}
      </div>
    </div>
  )
}

export default UserGreeting
