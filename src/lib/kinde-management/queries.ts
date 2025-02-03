import { Identities, Users, init } from '@kinde/management-api-js'

import { kindeManagementConfig } from '@/lib/kinde-management/config'
import { KindeIdentityType } from '@/lib/kinde-management/types'

import { getActiveUserAccount } from '@/utils/auth'

// export const getUserAccount = async () => {
//   init(kindeManagementConfig)
//   const userId = (await getActiveUserAccount())?.id
//   const res = await Users.getUserData({ id: userId })
//   return res
// }

// export const updateUserAccount = async () => {
//   init(kindeManagementConfig)
//   const userId = (await getActiveUserAccount())?.id
//   const res = await Users.updateUser({ id: userId, requestBody: {} })
//   return res
// }

// export const getUserIdentity = async ({ identityId }: GetIdentityData) => {
//   init(kindeManagementConfig)
//   const res = await Identities.getIdentity({ identityId })
//   return res
// }

// const refreshUserClaims = async () => {
//   init(kindeManagementConfig)
//   const userId = (await getActiveUserAccount())?.id
//   const res = await Users.refreshUserClaims({ userId })
//   return res
// }

const getUserIdentities = async () => {
  init(kindeManagementConfig)
  const userId = (await getActiveUserAccount())?.id
  const res = await Users.getUserIdentities({ userId })
  return res
}

/**
 * @TODO if user doesn't have an email identity yet (e.g. only have social),
 * should calling this update fn create one?
 */

/**
 * Updates a user's primary account email.
 *
 * Kinde management API currently does not have direct update ability,
 * so this function deletes the current identity
 * and creates a new one with the provided email.
 */
export const updateUserEmail = async (newEmail: string) => {
  init(kindeManagementConfig)
  const { identities } = await getUserIdentities()
  const { email, id: userId } = await getActiveUserAccount()

  // If no active user account info, abort.
  if (!identities?.length || !email) return null

  // Find current email identity.
  const currentIdentity = identities?.find(
    (id) =>
      id?.type === KindeIdentityType.email &&
      id?.name?.toLowerCase() === email?.toLowerCase(),
  )

  // If no current email identity, abort.
  if (!currentIdentity?.id) return null

  // Create new email identity.
  const createRes = await Users.createUserIdentity({
    userId,
    requestBody: { type: 'email', value: newEmail },
  })

  // If creation failed, abort.
  if (!createRes?.identity) return null

  // Delete the current email identity.
  const deleteRes = await Identities.deleteIdentity({
    identityId: currentIdentity?.id,
  })

  // Sync user data.
  await Users.refreshUserClaims({ userId })

  return deleteRes
}
