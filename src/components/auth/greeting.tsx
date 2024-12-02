import { KindeUser } from '@kinde-oss/kinde-auth-nextjs/dist/types'
import { FC } from 'react'

import Heading from '@/components/layout/heading'

type Props = {
  user: KindeUser | null
}

const Greeting: FC<Props> = ({ user }) => {
  if (!user) return null
  return <Heading text={`Welcome${user ? `, ${user?.given_name}` : ''}`} />
}

export default Greeting
