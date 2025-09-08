// sort-imports-ignore
import 'server-only'

import { createApiHandler, withUserFields } from '@/lib/db/api-handlers'
import { ValidationError, DatabaseConstraintError } from '@/lib/db/errors'
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
 * Get active user profile.
 * Can be used in both API routes and server components.
 */
export const handleGetActiveUser = async () => {
  return createApiHandler(async ({ user }) => {
    const result = await db.user.findUnique({ where: { accountId: user?.id } })
    return result
  })
}

/**
 * Get user profile by ID.
 * Can be used in both API routes and server components.
 */
export const handleGetUser = async (userId: string) => {
  return createApiHandler(async () => {
    const user = await db.user.findUnique({
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
  payload: Parameters<typeof db.user.create>[0]['data'],
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

      const result = await db.user.create({ data: dataWithUserFields })
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
 * Register a new user profile from authenticated Kinde user.
 * Can be used in both API routes and server components.
 */
export const handleRegisterUser = async () => {
  return createApiHandler(
    async ({ user }) => {
      // Check if profile already exists
      const currentProfile = await db.user.findUnique({
        where: { accountId: user?.id },
        select: { id: true },
      })

      if (currentProfile?.id) {
        throw new DatabaseConstraintError(
          'A profile for this account already exists.',
          'unique',
          'accountId',
        )
      }

      // Create user profile from Kinde user data
      const result = await db.user.create({
        data: {
          accountId: user?.id,
          createdBy: user?.id,
          updatedBy: user?.id,
          firstName: user?.given_name || '',
          lastName: user?.family_name || '',
          avatar: user?.picture,
          email: user?.email,
          phone: user?.phone_number,
        },
        select: { id: true },
      })

      return result
    },
    {
      messages: {
        success: 'User profile created successfully.',
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
  payload: Parameters<typeof db.user.update>['0']['data'],
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
        profile: payload as Parameters<
          typeof getProfileChanges
        >['0']['profile'],
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
      const result = await db.user.delete({
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

export type GetActiveUserResult = Awaited<
  ReturnType<typeof handleGetActiveUser>
>
export type GetUserResult = Awaited<ReturnType<typeof handleGetUser>>
export type CreateUserResult = Awaited<ReturnType<typeof handleCreateUser>>
export type RegisterUserResult = Awaited<ReturnType<typeof handleRegisterUser>>
export type UpdateUserResult = Awaited<ReturnType<typeof handleUpdateUser>>
export type UpdateActiveUserResult = Awaited<
  ReturnType<typeof handleUpdateActiveUser>
>
export type DeleteUserResult = Awaited<ReturnType<typeof handleDeleteUser>>
