// sort-imports-ignore
import 'server-only'

import {
  getUserProfiles,
  getUserProfile,
  getActiveUserProfile,
  createUserProfile,
  deleteUserProfile,
} from '@/lib/db/queries/user'

import { createApiHandler, withUserFields } from '@/lib/db/api-handlers'
import { ValidationError } from '@/lib/db/errors'
import { validatePayload } from '@/utils/zod'
import { userProfileSchema } from '@/lib/db/schemas/user'
import {
  updateAuthAccount,
  updateAuthEmail,
} from '@/lib/kinde-management/queries'
import { getProfileChanges } from '@/features/user/utils'
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server'
import { db } from '@/lib/db/client'

/**
 * Get all users.
 * Can be used in both API routes and server components.
 */
export const handleGetUsers = async () => {
  return createApiHandler(async () => {
    const users = await getUserProfiles()
    return users || []
  })
}

/**
 * Get active user profile.
 * Can be used in both API routes and server components.
 */
export const handleGetActiveUser = async () => {
  return createApiHandler(async () => {
    const user = await getActiveUserProfile()
    return user
  })
}

/**
 * Get user by ID.
 * Can be used in both API routes and server components.
 */
export const handleGetUser = async (userId: string) => {
  return createApiHandler(async () => {
    if (!userId) {
      throw new Error('User ID is required')
    }

    const user = await getUserProfile({
      where: { id: userId },
    })
    return user
  })
}

/**
 * Create a user profile.
 * Can be used in both API routes and server components.
 */
export const handleCreateUser = async (
  payload: Parameters<typeof createUserProfile>[0]['data'],
) => {
  return createApiHandler(
    async ({ user }) => {
      // Validate payload
      const validation = validatePayload(userProfileSchema.api, payload)
      if (!validation?.success) {
        throw new ValidationError(
          'Invalid data provided.',
          validation.errors || {},
        )
      }

      // Add user fields for audit trail
      const dataWithUserFields = withUserFields(payload, user?.id || '', [
        'createdBy',
        'updatedBy',
      ])

      const result = await createUserProfile({ data: dataWithUserFields })
      return result
    },
    {
      messages: {
        success: 'User created successfully.',
      },
      isMutation: true,
    },
  )
}

/**
 * Update a user profile.
 * Can be used in both API routes and server components.
 */
export const handleUpdateUser = async (
  userId: string,
  payload: Parameters<typeof db.user.update>[0]['data'],
) => {
  return createApiHandler(
    async ({ user }) => {
      if (!userId) {
        throw new Error('User ID is required')
      }

      // Validate payload
      const validation = validatePayload(userProfileSchema.api, payload)
      if (!validation?.success) {
        throw new ValidationError(
          'Invalid data provided.',
          validation.errors || {},
        )
      }

      // Add user fields for audit trail
      const dataWithUserFields = withUserFields(payload, user?.id || '')

      const result = await db.user.update({
        where: { id: userId },
        data: dataWithUserFields,
      })
      return result
    },
    {
      messages: {
        success: 'User updated successfully.',
      },
      isMutation: true,
    },
  )
}

/**
 * Update the active user's profile.
 * Can be used in both API routes and server components.
 * Includes special logic for updating Kinde account details.
 */
export const handleUpdateActiveUser = async (
  payload: any, // Using any for now to match route expectations
) => {
  return createApiHandler(
    async ({ user }) => {
      // Validate payload
      const validation = validatePayload(userProfileSchema.api, payload)
      if (!validation?.success) {
        throw new ValidationError(
          'Invalid data provided.',
          validation.errors || {},
        )
      }

      const changes = getProfileChanges({
        account: user,
        profile: payload as any, // Type assertion for compatibility
      })

      // Get Kinde session for token refresh
      const { refreshTokens } = getKindeServerSession()

      // Apply email update to Kinde account record
      if (changes?.email) {
        const accountUpdate = await updateAuthEmail(
          (payload?.email as string) || changes.email,
        )
        /** @todo Check if Kinde provides errors we can use to be more specific. */
        if (!accountUpdate) {
          throw new Error('User account could not be updated.')
        }
        // Refresh session data after successful email update
        await refreshTokens()
      }

      // Apply name update to Kinde account record
      if (changes?.firstName || changes?.lastName) {
        /** @todo Check if Kinde provides errors we can use to be more specific. */
        const accountUpdate = await updateAuthAccount({
          given_name: payload?.firstName as string,
          family_name: payload?.lastName as string,
        })
        if (!accountUpdate) {
          throw new Error('User account could not be updated.')
        }
        // Refresh session data after successful name update
        await refreshTokens()
      }

      // Update user profile in database
      const result = await db.user.update({
        where: { accountId: user?.id },
        data: {
          ...payload,
          email: payload?.email || user?.email,
          updatedBy: user?.id,
        },
      })

      if (!result) {
        throw new Error('User profile could not be updated.')
      }

      return result
    },
    {
      authorizationCheck: async ({ user }) => {
        // Validate that user is updating their own profile
        if (payload?.accountId && payload.accountId !== user?.id) {
          return false
        }
        return true
      },
      messages: {
        success: 'User updated successfully.',
        unauthorized: 'User not authorized to update this profile.',
      },
      isMutation: true,
    },
  )
}

/**
 * Delete a user profile.
 * Can be used in both API routes and server components.
 */
export const handleDeleteUser = async (userId: string) => {
  return createApiHandler(
    async () => {
      if (!userId) {
        throw new Error('User ID is required')
      }

      const result = await deleteUserProfile({
        where: { id: userId },
      })
      return result
    },
    {
      messages: {
        success: 'User deleted successfully.',
      },
      isMutation: true,
    },
  )
}

export type GetUsersResult = Awaited<ReturnType<typeof handleGetUsers>>
export type GetActiveUserResult = Awaited<
  ReturnType<typeof handleGetActiveUser>
>
export type GetUserResult = Awaited<ReturnType<typeof handleGetUser>>
export type CreateUserResult = Awaited<ReturnType<typeof handleCreateUser>>
export type UpdateUserResult = Awaited<ReturnType<typeof handleUpdateUser>>
export type UpdateActiveUserResult = Awaited<
  ReturnType<typeof handleUpdateActiveUser>
>
export type DeleteUserResult = Awaited<ReturnType<typeof handleDeleteUser>>
