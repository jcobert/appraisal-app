import { User } from '@prisma/client'
import { FC } from 'react'

import Heading from '@/components/layout/heading'

type Props = {
  user: User | null
}

const Greeting: FC<Props> = ({ user }) => {
  if (!user) return null
  return (
    <Heading
      text={`Welcome${user?.firstName ? `, ${user?.firstName}.` : ''}`}
    />
  )
}

export default Greeting
