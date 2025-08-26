// sort-imports-ignore
import 'server-only'

import {
  getOrgMember,
  getActiveUserOrgMember,
  updateOrgMember,
  deleteOrgMember,
  userIsOwner,
  userIsMember,
} from '@/lib/db/queries/organization'
import { orgMemberSchema } from '@/lib/db/schemas/org-member'

import {
  createApiHandler,
  ValidationError,
  withUserFields,
} from '@/lib/api-handlers'
import { validatePayload } from '@/utils/zod'

/**
 * Get a specific organization member by ID.
 * Can be used in both API routes and server components.
 */
export const handleGetOrgMember = async (
  organizationId: string,
  memberId: string,
) => {
  return createApiHandler(async () => {
    if (!organizationId) {
      throw new Error('Organization ID is required')
    }
    if (!memberId) {
      throw new Error('Member ID is required')
    }

    const member = await getOrgMember({ organizationId, memberId })
    return member
  })
}

/**
 * Get the active user's organization member data.
 * Can be used in both API routes and server components.
 */
export const handleGetActiveUserOrgMember = async (organizationId: string) => {
  return createApiHandler(async () => {
    if (!organizationId) {
      throw new Error('Organization ID is required')
    }

    const member = await getActiveUserOrgMember({ organizationId })
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
  payload: Parameters<typeof updateOrgMember>[0]['payload'],
) => {
  return createApiHandler(
    async ({ user }) => {
      if (!user?.id) {
        throw new Error('User not authenticated')
      }

      if (!organizationId) {
        throw new Error('Organization ID is required')
      }
      if (!memberId) {
        throw new Error('Member ID is required')
      }

      // Validate payload
      const validation = validatePayload(orgMemberSchema.api, payload)
      if (!validation?.success) {
        throw new ValidationError(
          'Invalid data provided.',
          validation?.errors || {},
        )
      }

      const result = await updateOrgMember({
        organizationId,
        memberId,
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
  payload: Parameters<typeof updateOrgMember>[0]['payload'],
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
      const validation = validatePayload(orgMemberSchema.api, payload)
      if (!validation?.success) {
        throw new ValidationError(
          'Invalid data provided.',
          validation.errors || {},
        )
      }

      // First get the active user's member record
      const activeUserMember = await getActiveUserOrgMember({ organizationId })
      if (!activeUserMember?.id) {
        throw new Error('Active user is not a member of this organization')
      }

      const result = await updateOrgMember({
        organizationId,
        memberId: activeUserMember.id,
        payload: withUserFields(payload, user?.id),
      })
      return result
    },
    {
      authorizationCheck: async () => {
        // For updating your own member record, just need to be a member
        const isMember = await userIsMember({ organizationId })
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
 * Delete an organization member.
 * Can be used in both API routes and server components.
 */
export const handleDeleteOrgMember = async (
  organizationId: string,
  memberId: string,
) => {
  return createApiHandler(
    async () => {
      if (!organizationId) {
        throw new Error('Organization ID is required')
      }
      if (!memberId) {
        throw new Error('Member ID is required')
      }

      const result = await deleteOrgMember({
        organizationId,
        memberId,
      })
      return result
    },
    {
      authorizationCheck: async () => {
        const isOwner = await userIsOwner({ organizationId })
        return isOwner
      },
      messages: {
        unauthorized: 'Unauthorized to delete organization members.',
        success: 'Member removed from organization successfully.',
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
export type DeleteOrgMemberResult = Awaited<
  ReturnType<typeof handleDeleteOrgMember>
>
