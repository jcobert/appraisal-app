import { Appraiser } from '@prisma/client'
import Link from 'next/link'
import { FC } from 'react'

import { fullName } from '@/utils/string'

import Avatar from '@/components/general/avatar'

type Props = {
  appraiser?: Appraiser | null
}

const AppraiserCard: FC<Props> = ({ appraiser }) => {
  const { firstName, lastName, id } = appraiser || {}
  const name = fullName(firstName, lastName)

  return (
    <Link
      href={`/appraisers/${id}`}
      className='border rounded p-4 group transition hover:border-brand/50 hover:shadow-sm'
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

export default AppraiserCard
