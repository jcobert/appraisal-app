// sort-imports-ignore
import 'server-only'

import {
  getUserProfiles,
  getUserProfile,
  getActiveUserProfile,
  createUserProfile,
  updateUserProfile,
  deleteUserProfile,
} from '@/lib/db/queries/user'

import {
  createApiHandler,
  ValidationError,
  withUserFields,
} from '@/lib/api-handlers'
import { validatePayload } from '@/utils/zod'
import { userProfileSchema } from '@/lib/db/schemas/user'

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
  payload: Parameters<typeof updateUserProfile>[0]['data'],
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

      const result = await updateUserProfile({
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
export type DeleteUserResult = Awaited<ReturnType<typeof handleDeleteUser>>
