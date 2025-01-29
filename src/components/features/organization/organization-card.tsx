import { Organization } from '@prisma/client'
import Link from 'next/link'
import { FC } from 'react'

import Avatar from '@/components/general/avatar'

type Props = {
  organization?: Organization | null
}

const OrganizationCard: FC<Props> = ({ organization }) => {
  const { name, id } = organization || {}

  return (
    <Link
      href={`/organizations/${id}`}
      className='border rounded p-4 group transition hover:border-brand/50 hover:shadow-sm bg-almost-white'
    >
      <div className='flex gap-4 items-center'>
        <Avatar
          name={name}
          size='sm'
          // className='group-hover:border-brand-dark transition'
          textClassName='group-hover:text-brand-dark transition'
        />
        <span className='group-hover:text-brand-dark transition text-lg'>
          {name}
        </span>
      </div>
    </Link>
  )
}

export default OrganizationCard
