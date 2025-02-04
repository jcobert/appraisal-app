import { User } from '@prisma/client'
import { FC } from 'react'

import UserProfileForm from '@/components/features/user/user-profile-form'
import Heading from '@/components/layout/heading'

import { SessionUser } from '@/types/auth'

type Props = {
  sessionUser: SessionUser
  userProfile: User | null
}

const UserProfilePage: FC<Props> = ({ sessionUser, userProfile }) => {
  const { id, family_name, given_name, email, phone_number, picture } =
    sessionUser || {}

  const initialData =
    userProfile ??
    ({
      accountId: id,
      firstName: given_name || '',
      lastName: family_name || '',
      email,
      phone: phone_number,
      avatar: picture,
    } as User)

  return (
    <div className='flex flex-col gap-4'>
      <Heading
        text={initialData ? 'My Profile' : 'New Appraiser'}
        alignment='center'
        className='font-medium sm:text-2xl'
      />
      <UserProfileForm initialData={initialData} />
    </div>
  )
}

export default UserProfilePage
