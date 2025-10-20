// sort-imports-ignore
import 'server-only'

import {
  Identities,
  UpdateUserData,
  Users,
  Callbacks,
  init,
} from '@kinde/management-api-js'

import { kindeManagementConfig } from '@/lib/kinde-management/config'
import { KindeIdentityType } from '@/lib/kinde-management/types'

import { getActiveUserAccount } from '@/utils/auth'

export const addLogoutRedirectUrls = async (urls: string[]) => {
  if (!process.env.KINDE_CLIENT_ID) {
    throw new Error('Missing environment variable: KINDE_CLIENT_ID')
  }
  if (!urls?.length) return null
  try {
    init(kindeManagementConfig)
    const res = await Callbacks.addLogoutRedirectUrLs({
      appId: process.env.KINDE_CLIENT_ID,
      requestBody: { urls },
    })
    return res
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(err)
    return null
  }
}

export const deleteLogoutRedirectUrl = async (url: string) => {
  if (!process.env.KINDE_CLIENT_ID) {
    throw new Error('Missing environment variable: KINDE_CLIENT_ID')
  }
  if (!url) return null
  try {
    init(kindeManagementConfig)
    const res = await Callbacks.deleteLogoutUrLs({
      appId: process.env.KINDE_CLIENT_ID,
      urls: url,
    })
    return res
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(err)
    return null
  }
}

export const getUserIdentities = async (options?: {
  type?: KindeIdentityType
}) => {
  init(kindeManagementConfig)
  const { type } = options || {}
  const userId = (await getActiveUserAccount())?.id
  if (!userId) return null
  const res = await Users.getUserIdentities({ userId })
  if (!type) return res?.identities || []
  const identities = res?.identities?.filter((id) => id?.type === type)
  return identities || []
}

/**
 * Updates a user's primary account email.
 *
 * Kinde management API currently does not have direct update ability,
 * so this function deletes the current identity
 * and creates a new one with the provided email.
 */
export const updateAuthEmail = async (newEmail: string) => {
  init(kindeManagementConfig)
  const identities = await getUserIdentities()
  const userAccount = await getActiveUserAccount()

  // If no active user account info, abort.
  if (!identities?.length || !userAccount) return null

  const { email, id: userId } = userAccount || {}

  // Find current email identity.
  const currentIdentity = identities?.find(
    (id) =>
      id?.type === KindeIdentityType.email &&
      !!email &&
      id?.name?.toLowerCase() === email?.toLowerCase(),
  )

  // Create new email identity.
  const createRes = await Users.createUserIdentity({
    userId,
    requestBody: { type: 'email', value: newEmail },
  })

  // If creation failed, abort.
  if (!createRes?.identity) return null

  let response = createRes

  // Delete the outgoing email identity if it exists.
  if (currentIdentity?.id) {
    response = await Identities.deleteIdentity({
      identityId: currentIdentity?.id,
    })
  }

  // Sync user data.
  await Users.refreshUserClaims({ userId })

  return response
}

/** Updates a user's kinde account profile (e.g. first, last name). */
export const updateAuthAccount = async (
  newUser: UpdateUserData['requestBody'],
) => {
  init(kindeManagementConfig)
  const { id } = (await getActiveUserAccount()) || {}
  if (!id || !newUser || typeof newUser !== 'object') return null
  const res = await Users.updateUser({ id, requestBody: newUser })
  await Users.refreshUserClaims({ userId: id })
  return res
}
