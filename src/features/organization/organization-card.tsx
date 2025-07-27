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
      className='border rounded p-4 group transition hover:border-primary/50 hover:shadow-sm bg-almost-white dark:bg-dark-gray'
    >
      <div className='flex gap-4 items-center'>
        <Avatar image={avatar} name={name} />

        <span className='group-hover:text-primary transition text-lg'>
          {name}
        </span>
      </div>
    </Link>
  )
}

export default OrganizationCard
