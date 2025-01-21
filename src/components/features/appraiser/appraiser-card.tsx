import { Appraiser } from '@prisma/client'
import Link from 'next/link'
import { FC } from 'react'

import { fullName } from '@/utils/string'

type Props = {
  appraiser?: Appraiser | null
}

const AppraiserCard: FC<Props> = ({ appraiser }) => {
  const { firstName, lastName, id } = appraiser || {}
  const name = fullName(firstName, lastName)

  return (
    <div className='border rounded p-2'>
      <Link href={`/appraisers/${id}`}>{name}</Link>
    </div>
  )
}

export default AppraiserCard
