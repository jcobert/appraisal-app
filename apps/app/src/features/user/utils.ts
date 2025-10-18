import { User } from '@repo/database'

import { SessionUser } from '@/types/auth'

/** Compares a user profile and user account and returns an object of the profile updates. */
export const getProfileChanges = ({
  profile,
  account,
}: {
  profile: Partial<Omit<User, 'accountId' | 'id'>>
  account: SessionUser
}) => {
  const changes = {} as Pick<
    typeof profile,
    'firstName' | 'lastName' | 'phone' | 'email'
  >
  if (!profile || !account) return changes

  if (!!profile?.email && profile?.email !== account?.email) {
    changes.email = profile?.email
  }
  if (!!profile?.firstName && profile?.firstName !== account?.given_name) {
    changes.firstName = profile?.firstName
  }
  if (!!profile?.lastName && profile?.lastName !== account?.family_name) {
    changes.lastName = profile?.lastName
  }
  if (!!profile?.phone && profile?.phone !== account?.phone_number) {
    changes.phone = profile?.phone
  }
  return changes
}
