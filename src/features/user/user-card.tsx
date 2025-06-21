import { OrgMember, User } from '@prisma/client'
import { FC } from 'react'

import { fullName } from '@/utils/string'
import { cn } from '@/utils/style'

import Avatar from '@/components/general/avatar'

type Props = {
  user: User | undefined | null
  roles?: OrgMember['roles'] | null
  className?: string
}

const UserCard: FC<Props> = ({ user, roles, className }) => {
  const { firstName, lastName, avatar } = user || {}
  const name = fullName(firstName, lastName)

  const userRole = roles?.join(', ')

  return (
    <div
      className={cn(
        'border__ rounded-xl p-4 group transition hover:border-brand/50__ hover:shadow-sm__ bg-almost-white__',
        className,
      )}
    >
      <div className='flex gap-2 items-center'>
        <Avatar
          name={name}
          image={avatar}
          size='xs'
          // className='group-hover:border-brand-dark transition'
          // textClassName='group-hover:text-brand-dark transition'
        />
        <div className='flex flex-col gap-1'>
          <span className='group-hover:text-brand-dark__ leading-none transition text-lg__'>
            {name}
          </span>
          <span className='text-sm leading-none capitalize'>{userRole}</span>
        </div>
      </div>
    </div>
  )
}

export default UserCard
