import { OrgInvitationStatus, OrgMember, User } from '@prisma/client'
import { upperFirst } from 'lodash'
import { FC } from 'react'

import { fullName } from '@/utils/string'
import { cn } from '@/utils/style'

import Avatar from '@/components/general/avatar'

type Props = {
  user: Partial<User> | undefined | null
  roles?: OrgMember['roles'] | null
  className?: string
  status?: OrgInvitationStatus
}

const UserCard: FC<Props> = ({ user, roles, className, status }) => {
  const { firstName, lastName, avatar } = user || {}
  const name = fullName(firstName, lastName)

  const userRole = roles?.join(', ')

  return (
    <div className={cn('rounded-xl p-4 group transition', className)}>
      <div className='flex gap-2 items-center'>
        <Avatar name={name} image={avatar} size='xs' />
        <div className='flex flex-col gap-1'>
          <span className='leading-none transition'>{name}</span>
          {userRole ? (
            <span className='text-sm leading-none capitalize'>{userRole}</span>
          ) : null}
        </div>

        {status ? (
          <span
            className={cn('text-sm', [
              status === 'expired' && 'text-rose-700',
              status === 'pending' && 'text-gray-500',
            ])}
          >
            {`(${upperFirst(status)})`}
          </span>
        ) : null}
      </div>
    </div>
  )
}

export default UserCard
