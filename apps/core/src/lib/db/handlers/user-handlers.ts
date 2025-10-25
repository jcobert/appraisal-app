// sort-imports-ignore
import 'server-only'

import {
  createApiHandler,
  omitSystemFields,
  withUserFields,
} from '@/lib/db/api-handlers'
import { ValidationError, DatabaseConstraintError } from '@/lib/db/errors'
import { validatePayload, isValidationSuccess } from '@/utils/zod'
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
export const handleGetActiveUserProfile = async () => {
  return createApiHandler(async ({ user }) => {
    const result = await db.user.findUnique({ where: { accountId: user?.id } })
    return result
  })
}

/**
 * Get user profile by ID.
 * Can be used in both API routes and server components.
 */
export const handleGetUserProfile = async (userId: string) => {
  return createApiHandler(async () => {
    if (!userId) {
      throw new ValidationError('User ID is required.', {})
    }
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
export const handleCreateUserProfile = async (
  payload: Parameters<typeof db.user.create>[0]['data'],
) => {
  return createApiHandler(
    async ({ user }) => {
      // Validate payload for security and user input safety, preserve extra fields
      const validation = validatePayload(userProfileSchema.api, payload, {
        passthrough: true,
      })
      if (!isValidationSuccess(validation)) {
        throw new ValidationError(
          'Invalid data provided.',
          validation.errors || {},
        )
      }

      // For profile creation, we use the account ID since the profile doesn't exist yet
      // This is the only exception to our "always use profile ID" rule
      const userAccountId = user?.id || ''

      // Add user fields for audit trail to the sanitized data
      // Note: Using validation.data to get sanitized + validated input fields,
      // then adding audit fields and accountId that aren't part of the schema
      const dataWithUserFields = withUserFields(
        validation.data,
        userAccountId,
        ['createdBy', 'updatedBy'],
      )

      const result = await db.user.create({
        data: {
          ...dataWithUserFields,
          accountId: userAccountId, // Always set from authenticated context, not user input
        },
      })
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
      // NOTE: Special case - since we're creating the profile, we temporarily use
      // the account ID for audit fields. After creation, we'll use the profile ID.
      const userAccountId = user?.id || ''
      const result = await db.user.create({
        data: {
          accountId: userAccountId,
          // Temporarily use account ID for audit fields during profile creation
          createdBy: userAccountId,
          updatedBy: userAccountId,
          firstName: user?.given_name || '',
          lastName: user?.family_name || '',
          avatar: user?.picture,
          email: user?.email,
          phone: user?.phone_number,
        },
        select: { id: true },
      })

      // Now update the audit fields to use the newly created profile ID for consistency
      await db.user.update({
        where: { id: result.id },
        data: {
          createdBy: result.id,
          updatedBy: result.id,
        },
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
export const handleUpdateUserProfile = async (
  userId: string,
  payload: Parameters<typeof db.user.update>[0]['data'],
) => {
  return createApiHandler(
    async ({ userProfileId }) => {
      if (!userId) {
        throw new ValidationError('User ID is required.', {})
      }

      // Validate payload for security and user input safety, preserve extra fields
      const validation = validatePayload(
        userProfileSchema.api.partial(),
        payload,
        {
          passthrough: true,
        },
      )
      if (!isValidationSuccess(validation)) {
        throw new ValidationError(
          'Invalid data provided.',
          validation.errors || {},
        )
      }

      // Add user fields for audit trail
      const dataWithUserFields = withUserFields(
        omitSystemFields(validation.data, { exclude: ['accountId'] }),
        userProfileId,
      )

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
export const handleUpdateActiveUserProfile = async (
  payload: Parameters<typeof db.user.update>['0']['data'],
) => {
  return createApiHandler(
    async ({ user, userProfileId }) => {
      // Validate payload for security and user input safety, preserve extra fields
      const validation = validatePayload(userProfileSchema.api, payload, {
        passthrough: true,
      })
      if (!isValidationSuccess(validation)) {
        throw new ValidationError(
          'Invalid data provided.',
          validation.errors || {},
        )
      }

      const changes = getProfileChanges({
        account: user,
        profile: validation.data as Parameters<
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
          given_name: validation.data?.firstName as string,
          family_name: validation.data?.lastName as string,
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
        data: withUserFields(
          {
            ...validation.data,
            email: validation.data?.email || user?.email,
          },
          userProfileId,
        ),
        select: { id: true },
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
export const handleDeleteUserProfile = async (userId: string) => {
  return createApiHandler(
    async () => {
      if (!userId) {
        throw new ValidationError('User ID is required.', {})
      }

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
  ReturnType<typeof handleGetActiveUserProfile>
>
export type GetUserResult = Awaited<ReturnType<typeof handleGetUserProfile>>
export type CreateUserResult = Awaited<
  ReturnType<typeof handleCreateUserProfile>
>
export type RegisterUserResult = Awaited<ReturnType<typeof handleRegisterUser>>
export type UpdateUserResult = Awaited<
  ReturnType<typeof handleUpdateUserProfile>
>
export type UpdateActiveUserResult = Awaited<
  ReturnType<typeof handleUpdateActiveUserProfile>
>
export type DeleteUserResult = Awaited<
  ReturnType<typeof handleDeleteUserProfile>
>
