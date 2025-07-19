import { Organization } from '@prisma/client'
import Link from 'next/link'
import { FC } from 'react'

import Avatar from '@/components/general/avatar'

type Props = {
  organization?: Organization | null
}

const OrganizationCard: FC<Props> = ({ organization }) => {
  const { name, id, avatar } = organization || {}

  return (
    <Link
      href={`/organizations/${id}`}
      className='border rounded p-4 group transition hover:border-brand/50 hover:shadow-sm bg-almost-white dark:bg-dark-gray'
    >
      <div className='flex gap-4 items-center'>
        <Avatar
          image={avatar}
          name={name}
          // className='group-hover:border-brand-dark transition'
          // textClassName='group-hover:text-brand-dark transition'
        />

        <span className='group-hover:text-brand-dark group-hover:dark:text-brand-extra-light transition text-lg'>
          {name}
        </span>
      </div>
    </Link>
  )
}

export default OrganizationCard
