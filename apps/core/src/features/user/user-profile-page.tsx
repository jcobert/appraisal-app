import { type identity } from '@kinde/management-api-js'
import { FC } from 'react'

import { User } from '@repo/database'

import { KindeIdentityType } from '@/lib/kinde-management/types'
import { getUserIdentityComposition } from '@/lib/kinde-management/utils'

import Heading from '@/components/layout/heading'

import { SessionUser } from '@/types/auth'

import UserProfileForm from '@/features/user/user-profile-form'

type Props = {
  sessionUser: SessionUser
  userProfile: User | null
  identities?: identity[] | null
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
