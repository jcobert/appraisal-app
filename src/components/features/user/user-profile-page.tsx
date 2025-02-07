import { identity } from '@kinde/management-api-js'
import { User } from '@prisma/client'
import { FC } from 'react'

import { KindeIdentityType } from '@/lib/kinde-management/types'
import { getUserIdentityComposition } from '@/lib/kinde-management/utils'

import UserProfileForm from '@/components/features/user/user-profile-form'
import Heading from '@/components/layout/heading'

import { SessionUser } from '@/types/auth'

type Props = {
  sessionUser: SessionUser
  userProfile: User | null
  identities?: identity[]
}

const UserProfilePage: FC<Props> = ({
  sessionUser,
  userProfile,
  identities,
}) => {
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

  const identityType = getUserIdentityComposition(identities)
  const accountEditDisabled = identityType !== KindeIdentityType.email

  return (
    <div className='flex flex-col gap-4'>
      <Heading
        text='Profile and Account'
        alignment='center'
        className='font-medium sm:text-2xl'
      />
      <UserProfileForm
        initialData={initialData}
        readOnly={accountEditDisabled}
      />
    </div>
  )
}

export default UserProfilePage
