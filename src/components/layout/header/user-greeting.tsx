import Image from 'next/image'
import { FC } from 'react'
import { FaCircleUser } from 'react-icons/fa6'

import { fullName } from '@/utils/string'

import { useGetUserProfile } from '@/features/user/hooks/use-get-user-profile'

import { SessionData } from '@/types/auth'

type Props = { user: SessionData['profile'] }

export const UserGreeting: FC<Props> = (props) => {
  const { response } = useGetUserProfile({
    id: props.user?.id,
    options: { enabled: true, staleTime: 60 * 60 * 1000 },
  })

  const user = response?.data || props?.user

  if (!user) return null

  return (
    <div className='flex items-center justify-center mx-auto w-fit gap-2 group-hover:text-medium-gray group-hover:dark:text-gray-200 transition'>
      <div className='my-auto transition-all rounded-full size-8 border dark:border-gray-400'>
        {user?.avatar?.length ? (
          <Image
            src={user?.avatar}
            alt='user avatar'
            className='object-scale-down object-center rounded-full'
            width={32}
            height={32}
          />
        ) : (
          <FaCircleUser className='text-xl text-medium-gray min-w-full size-8' />
        )}
      </div>
      <div className='flex flex-col'>
        {user?.firstName ? (
          <div className='font-medium font-display text-balance'>
            {fullName(user?.firstName, user?.lastName)}
          </div>
        ) : null}
        {user?.email ? (
          <div className='-mt-1 text-xs text-medium-gray'>{user?.email}</div>
        ) : null}
      </div>
    </div>
  )
}

export default UserGreeting
