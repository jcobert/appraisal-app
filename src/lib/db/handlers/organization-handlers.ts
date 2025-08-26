// sort-imports-ignore
import 'server-only'

import {
  getOrganization,
  getUserOrganizations,
  updateOrganization,
  deleteOrganization,
  userIsOwner,
  createOrganization,
} from '@/lib/db/queries/organization'
import { organizationSchema } from '@/lib/db/schemas/organization'
import { getUserPermissions } from '@/lib/db/utils'

import {
  createApiHandler,
  ValidationError,
  AuthorizationError,
  withUserFields,
} from '@/lib/api-handlers'
import { validatePayload } from '@/utils/zod'

/**
 * Get organizations for the current user.
 * Can be used in both API routes and server components.
 */
export const handleGetUserOrganizations = async () => {
  return createApiHandler(async () => {
    const organizations = await getUserOrganizations()
    return organizations || []
  })
}

/**
 * Get a single organization by ID.
 * Can be used in both API routes and server components.
 */
export const handleGetOrganization = async (organizationId: string) => {
  return createApiHandler(async () => {
    if (!organizationId) {
      throw new Error('Organization ID is required')
    }

    const organization = await getOrganization({ organizationId })
    return organization
  })
}

/**
 * Update an organization (requires owner permissions).
 * Can be used in both API routes and server components.
 */
export const handleUpdateOrganization = async (
  organizationId: string,
  payload: Parameters<typeof updateOrganization>[0]['payload'],
) => {
  return createApiHandler(
    async ({ user }) => {
      if (!user?.id) {
        throw new Error('User not authenticated')
      }

      if (!organizationId) {
        throw new Error('Organization ID is required')
      }

      // Validate payload
      const validation = validatePayload(organizationSchema.api, payload)
      if (!validation?.success) {
        throw new ValidationError(
          'Invalid data provided.',
          validation.errors || {},
        )
      }

      // Skip auth checks in query since handler handles authorization
      const result = await updateOrganization({
        organizationId,
        payload: withUserFields(payload, user?.id),
      })
      return result
    },
    {
      authorizationCheck: async () => {
        const isOwner = await userIsOwner({ organizationId })
        return isOwner
      },
      messages: {
        unauthorized: 'Unauthorized to update this organization.',
        success: 'Organization updated successfully.',
      },
      isMutation: true,
    },
  )
}

/**
 * Delete an organization (requires owner permissions).
 * Can be used in both API routes and server components.
 */
export const handleDeleteOrganization = async (organizationId: string) => {
  return createApiHandler(
    async () => {
      if (!organizationId) {
        throw new Error('Organization ID is required')
      }

      const result = await deleteOrganization({
        organizationId,
      })
      return result
    },
    {
      authorizationCheck: async () => {
        const isOwner = await userIsOwner({ organizationId })
        return isOwner
      },
      messages: {
        unauthorized: 'Unauthorized to delete this organization.',
        success: 'Organization deleted successfully.',
      },
      isMutation: true,
    },
  )
}

/**
 * Create a new organization with user ownership.
 * Handles user profile linking, duplicate checking, and member creation.
 * Can be used in both API routes and server components.
 */
export const handleCreateOrganization = async (
  payload: Parameters<typeof createOrganization>[0]['data'],
) => {
  return createApiHandler(
    async () => {
      // Import here to avoid circular dependencies
      const { getActiveUserProfile } = await import('@/lib/db/queries/user')
      const { isAuthenticated } = await import('@/utils/auth')

      const { user } = await isAuthenticated()
      if (!user?.id) {
        throw new AuthorizationError('User not authenticated.')
      }

      // Validate payload
      const validation = validatePayload(organizationSchema.api, payload)
      if (!validation?.success) {
        throw new ValidationError(
          'Invalid data provided.',
          validation.errors || {},
        )
      }

      const userProfile = await getActiveUserProfile()
      if (!userProfile?.id) {
        throw new ValidationError('No user profile found.', {})
      }

      // Check for duplicate organization name for this owner
      const existingOrgs = await getUserOrganizations({
        owner: true,
        filter: { name: { equals: payload?.name, mode: 'insensitive' } },
      })

      if (existingOrgs?.length) {
        throw new ValidationError(
          'An organization with this name already exists.',
          {},
        )
      }

      // Create organization with owner membership
      const result = await createOrganization({
        data: {
          ...payload,
          members: {
            create: {
              userId: userProfile.id,
              roles: ['owner'],
              createdBy: user.id,
              updatedBy: user.id,
            },
          },
          createdBy: user.id,
          updatedBy: user.id,
        },
      })

      return result
    },
    {
      messages: {
        success: 'Organization created successfully.',
      },
      isMutation: true,
    },
  )
}

/**
 * Get user permissions for an organization.
 * Can be used in both API routes and server components.
 */
export const handleGetOrganizationPermissions = async (
  organizationId: string,
) => {
  return createApiHandler(async () => {
    if (!organizationId) {
      throw new Error('Organization ID is required')
    }

    const permissions = await getUserPermissions(organizationId)
    return permissions
  })
}

export type GetUserOrganizationsResult = Awaited<
  ReturnType<typeof handleGetUserOrganizations>
>
export type GetOrganizationResult = Awaited<
  ReturnType<typeof handleGetOrganization>
>
export type CreateOrganizationResult = Awaited<
  ReturnType<typeof handleCreateOrganization>
>
export type UpdateOrganizationResult = Awaited<
  ReturnType<typeof handleUpdateOrganization>
>
export type DeleteOrganizationResult = Awaited<
  ReturnType<typeof handleDeleteOrganization>
>
export type GetOrganizationPermissionsResult = Awaited<
  ReturnType<typeof handleGetOrganizationPermissions>
>
