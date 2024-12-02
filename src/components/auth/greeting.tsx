import { FC } from 'react'

import Heading from '@/components/layout/heading'

import { SessionData } from '@/types/auth'

type Props = {
  user: SessionData['user']
}

const Greeting: FC<Props> = ({ user }) => {
  if (!user) return null
  return (
    <Heading
      text={`Welcome${user?.given_name ? `, ${user?.given_name}.` : ''}`}
    />
  )
}

export default Greeting
