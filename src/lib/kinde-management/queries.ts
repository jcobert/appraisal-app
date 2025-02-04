// sort-imports-ignore
import 'server-only'

import {
  Identities,
  UpdateUserData,
  Users,
  init,
} from '@kinde/management-api-js'

import { kindeManagementConfig } from '@/lib/kinde-management/config'
import { KindeIdentityType } from '@/lib/kinde-management/types'

import { getActiveUserAccount } from '@/utils/auth'

const getUserIdentities = async () => {
  init(kindeManagementConfig)
  const userId = (await getActiveUserAccount())?.id
  const res = await Users.getUserIdentities({ userId })
  return res
}

/**
 * @TODO if user doesn't have an email identity yet (e.g. only have social),
 * should we create identity and not delete existing?
 */

/**
 * Updates a user's primary account email.
 *
 * Kinde management API currently does not have direct update ability,
 * so this function deletes the current identity
 * and creates a new one with the provided email.
 */
export const updateAuthEmail = async (newEmail: string) => {
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

/** Updates a user's kinde account profile (e.g. first, last name). */
export const updateAuthAccount = async (
  newUser: UpdateUserData['requestBody'],
) => {
  init(kindeManagementConfig)
  const { id } = await getActiveUserAccount()
  if (!id || !newUser || typeof newUser !== 'object') return null
  const res = await Users.updateUser({ id, requestBody: newUser })
  await Users.refreshUserClaims({ userId: id })
  return res
}
