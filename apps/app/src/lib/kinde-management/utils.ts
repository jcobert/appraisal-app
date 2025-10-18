import { identity } from '@kinde/management-api-js'

import { KindeIdentityType } from '@/lib/kinde-management/types'

/** Given an array of identities, returns whether they are all email, all google, or a combination. */
export const getUserIdentityComposition = (
  identities: identity[] | null = [],
) => {
  let composition: 'email' | 'google' | 'mixed' | 'none' = 'mixed'
  const totalCount = identities?.length
  const email = identities?.filter((id) => id.type === KindeIdentityType.email)
  const google = identities?.filter(
    (id) => id.type === KindeIdentityType.google,
  )
  if (!totalCount) {
    composition = 'none'
    return composition
  }
  if (email?.length === totalCount) {
    composition = 'email'
  } else if (google?.length === totalCount) {
    composition = 'google'
  }
  return composition
}
