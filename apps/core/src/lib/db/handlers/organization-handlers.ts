// sort-imports-ignore
import 'server-only'

import { userIsOwner, userIsMember } from '@/lib/db/queries/organization'
import { organizationSchema } from '@/lib/db/schemas/organization'
import { getUserPermissions } from '@/lib/db/utils'

import {
  createApiHandler,
  omitSystemFields,
  withUserFields,
} from '@/lib/db/api-handlers'
import { ValidationError } from '@/lib/db/errors'
import { validatePayload, isValidationSuccess } from '@/utils/zod'
import { db } from '@/lib/db/client'

/**
 * Get organizations for the current user.
 * Can be used in both API routes and server components.
 */
export const handleGetUserOrganizations = async () => {
  return createApiHandler(async ({ user }) => {
    const organizations = await db.organization.findMany({
      where: {
        members: {
          some: {
            user: { accountId: user?.id },
            active: true,
          },
        },
      },
    })
    return organizations || []
  })
}

/**
 * Get an organization by ID (requires membership).
 * Can be used in both API routes and server components.
 */
export const handleGetOrganization = async (organizationId: string) => {
  return createApiHandler(
    async () => {
      if (!organizationId) {
        throw new ValidationError('Organization ID is required.', {})
      }
      const organization = await db.organization.findUnique({
        where: { id: organizationId },
        include: {
          members: {
            where: { active: true },
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  avatar: true,
                  email: true,
                },
              },
            },
            omit: { createdBy: true, updatedBy: true },
          },
          invitations: {
            where: { status: { in: ['expired', 'pending'] } },
            select: {
              id: true,
              status: true,
              expires: true,
              inviteeFirstName: true,
              inviteeLastName: true,
              inviteeEmail: true,
              roles: true,
              organizationId: true,
              createdAt: true,
              updatedAt: true,
            },
          },
        },
        omit: { createdBy: true, updatedBy: true },
      })
      return organization
    },
    {
      authorizationCheck: async ({ user }) => {
        // User must be a member of org.
        const isMember = await userIsMember({
          organizationId,
          accountId: user?.id,
        })
        return isMember
      },
    },
  )
}

/**
 * Update an organization (requires owner permissions).
 * Can be used in both API routes and server components.
 */
export const handleUpdateOrganization = async (
  organizationId: string,
  payload: Parameters<typeof db.organization.update>[0]['data'],
) => {
  return createApiHandler(
    async ({ userProfileId }) => {
      if (!organizationId) {
        throw new ValidationError('Organization ID is required.', {})
      }

      // Validate payload for security and user input safety, preserve extra fields
      const validation = validatePayload(
        organizationSchema.api.partial(),
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

      const result = await db.organization.update({
        where: { id: organizationId },
        data: withUserFields(omitSystemFields(validation.data), userProfileId),
        select: { id: true, name: true },
      })
      return result
    },
    {
      authorizationCheck: async ({ user }) => {
        const isOwner = await userIsOwner({
          organizationId,
          accountId: user?.id,
        })
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
        throw new ValidationError('Organization ID is required.', {})
      }
      const result = await db.organization.delete({
        where: { id: organizationId },
        select: { name: true },
      })
      return result
    },
    {
      authorizationCheck: async ({ user }) => {
        const isOwner = await userIsOwner({
          organizationId,
          accountId: user?.id,
        })
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
  payload: Parameters<typeof db.organization.create>[0]['data'],
) => {
  return createApiHandler(
    async ({ user, userProfileId }) => {
      // Validate payload for security and user input safety, preserve extra fields
      const validation = validatePayload(organizationSchema.api, payload, {
        passthrough: true,
      })
      if (!isValidationSuccess(validation)) {
        throw new ValidationError(
          'Invalid data provided.',
          validation.errors || {},
        )
      }

      if (!userProfileId) {
        throw new ValidationError('No user profile found.', {})
      }

      // Check for duplicate organization name for this owner
      const existingOrgs = await db.organization.findMany({
        where: {
          members: {
            some: {
              user: { accountId: user?.id },
              isOwner: true,
            },
          },
          name: { equals: payload?.name, mode: 'insensitive' },
        },
      })

      if (existingOrgs?.length) {
        throw new ValidationError(
          'An organization with this name already exists.',
          {},
        )
      }

      // Create organization with owner membership
      const result = await db.organization.create({
        data: {
          ...validation.data,
          members: {
            create: {
              userId: userProfileId,
              isOwner: true,
              roles: [],
              createdBy: userProfileId,
              updatedBy: userProfileId,
            },
          },
          createdBy: userProfileId,
          updatedBy: userProfileId,
        },
        select: { id: true, name: true },
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
      throw new ValidationError('Organization ID is required.', {})
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
