// sort-imports-ignore
import 'server-only'

import {
  getActiveUserOrgMember,
  userIsOwner,
  userIsMember,
} from '@/lib/db/queries/organization'
import { orgMemberSchema } from '@/lib/db/schemas/org-member'

import {
  createApiHandler,
  omitSystemFields,
  withUserFields,
} from '@/lib/db/api-handlers'
import { ValidationError } from '@/lib/db/errors'
import { validatePayload, isValidationSuccess } from '@/utils/zod'
import { db } from '@/lib/db/client'

/**
 * Get a specific organization member by ID.
 * Can be used in both API routes and server components.
 */
export const handleGetOrgMember = async (
  organizationId: string,
  memberId: string,
) => {
  return createApiHandler(async () => {
    // Simple checks for required route parameters
    if (!organizationId) {
      throw new ValidationError('Organization ID is required.', {})
    }
    if (!memberId) {
      throw new ValidationError('Member ID is required.', {})
    }

    const member = await db.orgMember.findUnique({
      where: { id: memberId, organizationId },
      include: { user: true },
    })
    return member
  })
}

/**
 * Get the active user's organization member data.
 * Can be used in both API routes and server components.
 */
export const handleGetActiveUserOrgMember = async (organizationId: string) => {
  return createApiHandler(async ({ user }) => {
    // Simple check for required route parameter
    if (!organizationId) {
      throw new ValidationError('Organization ID is required.', {})
    }

    const member = await getActiveUserOrgMember({
      organizationId,
      accountId: user.id,
    })
    return member
  })
}

/**
 * Update an organization member.
 * Can be used in both API routes and server components.
 */
export const handleUpdateOrgMember = async (
  organizationId: string,
  memberId: string,
  payload: Parameters<typeof db.orgMember.update>[0]['data'],
) => {
  return createApiHandler(
    async (context) => {
      // Validate payload
      const validation = validatePayload(orgMemberSchema.api.partial(), payload)
      if (!isValidationSuccess(validation)) {
        throw new ValidationError(
          'Invalid data provided.',
          validation.errors || {},
        )
      }

      // Simple checks for required route parameters
      if (!organizationId) {
        throw new ValidationError('Organization ID is required.', {})
      }
      if (!memberId) {
        throw new ValidationError('Member ID is required.', {})
      }

      const result = await db.orgMember.update({
        where: { id: memberId, organizationId },
        data: withUserFields(
          omitSystemFields(validation.data),
          context.userProfileId,
        ),
        select: { id: true },
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
        unauthorized: 'Unauthorized to update organization members.',
        success: 'Member updated successfully.',
      },
      isMutation: true,
    },
  )
}

/**
 * Update the active user's organization member data.
 * Can be used in both API routes and server components.
 */
export const handleUpdateActiveUserOrgMember = async (
  organizationId: string,
  payload: Parameters<typeof db.orgMember.update>[0]['data'],
) => {
  return createApiHandler(
    async ({ user, userProfileId }) => {
      // Validate payload
      const validation = validatePayload(orgMemberSchema.api, payload)
      if (!isValidationSuccess(validation)) {
        throw new ValidationError(
          'Invalid data provided.',
          validation.errors || {},
        )
      }

      // Simple check for required route parameter
      if (!organizationId) {
        throw new ValidationError('Organization ID is required.', {})
      }

      // First get the active user's member record
      const activeUserMember = await getActiveUserOrgMember({
        organizationId,
        accountId: user?.id,
      })

      if (!activeUserMember?.id) {
        throw new Error('Failed to get active member.')
      }

      const result = await db.orgMember.update({
        where: { id: activeUserMember?.id, organizationId },
        data: withUserFields(validation.data, userProfileId),
      })
      return result
    },
    {
      authorizationCheck: async ({ user }) => {
        // For updating your own member record, just need to be a member
        const isMember = await userIsMember({
          organizationId,
          accountId: user?.id,
        })
        return isMember
      },
      messages: {
        unauthorized: 'Unauthorized to update your organization membership.',
        success: 'Member updated successfully.',
      },
      isMutation: true,
    },
  )
}

/**
 * Leave an organization (self-removal).
 * Deactivates the active user's membership in the organization.
 * Can be used in both API routes and server components.
 */
export const handleLeaveOrganization = async (organizationId: string) => {
  return createApiHandler(
    async ({ user, userProfileId }) => {
      // Simple check for required route parameter
      if (!organizationId) {
        throw new ValidationError('Organization ID is required.', {})
      }

      // Get the active user's member record
      const activeUserMember = await getActiveUserOrgMember({
        organizationId,
        accountId: user?.id,
      })

      if (!activeUserMember?.id) {
        throw new Error('Failed to get active member.')
      }

      // Prevent the last owner from leaving
      const owners = await db.orgMember.findMany({
        where: {
          organizationId,
          active: true,
          roles: { has: 'owner' },
        },
      })

      const isLastOwner =
        owners.length === 1 && owners[0]?.id === activeUserMember.id

      if (isLastOwner) {
        throw new ValidationError(
          'Cannot leave organization. You are the only owner. Please transfer ownership or delete the organization.',
          {},
        )
      }

      // Deactivate the member
      const result = await db.orgMember.update({
        where: { id: activeUserMember.id, organizationId },
        data: withUserFields({ active: false }, userProfileId),
        include: { organization: true },
      })

      return result
    },
    {
      authorizationCheck: async ({ user }) => {
        // User must be a member to leave
        const isMember = await userIsMember({
          organizationId,
          accountId: user?.id,
        })
        return isMember
      },
      messages: {
        unauthorized: 'Unauthorized to leave this organization.',
        success: 'You have left the organization.',
      },
      isMutation: true,
    },
  )
}

export type GetOrgMemberResult = Awaited<ReturnType<typeof handleGetOrgMember>>
export type GetActiveUserOrgMemberResult = Awaited<
  ReturnType<typeof handleGetActiveUserOrgMember>
>
export type UpdateOrgMemberResult = Awaited<
  ReturnType<typeof handleUpdateOrgMember>
>
export type UpdateActiveUserOrgMemberResult = Awaited<
  ReturnType<typeof handleUpdateActiveUserOrgMember>
>
export type LeaveOrganizationResult = Awaited<
  ReturnType<typeof handleLeaveOrganization>
>
