// sort-imports-ignore
import 'server-only'

import {
  getActiveUserOrgMember,
  userIsOwner,
  userIsMember,
} from '@/lib/db/queries/organization'
import { orgMemberSchema } from '@/lib/db/schemas/org-member'

import { createApiHandler, withUserFields } from '@/lib/db/api-handlers'
import { ValidationError } from '@/lib/db/errors'
import { validatePayload } from '@/utils/zod'
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
    const member = await getActiveUserOrgMember({
      organizationId,
      userId: user?.id,
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
    async ({ user }) => {
      // Validate payload
      const validation = validatePayload(orgMemberSchema.api, payload)
      if (!validation?.success) {
        throw new ValidationError(
          'Invalid data provided.',
          validation?.errors || {},
        )
      }

      const result = await db.orgMember.update({
        where: { id: memberId, organizationId },
        data: withUserFields(payload, user?.id),
      })
      return result
    },
    {
      authorizationCheck: async ({ user }) => {
        const isOwner = await userIsOwner({ organizationId, userId: user?.id })
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
    async ({ user }) => {
      // Validate payload
      const validation = validatePayload(orgMemberSchema.api, payload)
      if (!validation?.success) {
        throw new ValidationError(
          'Invalid data provided.',
          validation.errors || {},
        )
      }

      // First get the active user's member record
      const activeUserMember = await getActiveUserOrgMember({
        organizationId,
        userId: user?.id,
      })

      if (!activeUserMember?.id) {
        throw new Error('Failed to get active member.')
      }

      const result = await db.orgMember.update({
        where: { id: activeUserMember?.id, organizationId },
        data: withUserFields(payload, user?.id),
      })
      return result
    },
    {
      authorizationCheck: async ({ user }) => {
        // For updating your own member record, just need to be a member
        const isMember = await userIsMember({
          organizationId,
          userId: user?.id,
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
 * Delete an organization member.
 * Can be used in both API routes and server components.
 */
export const handleDeleteOrgMember = async (
  organizationId: string,
  memberId: string,
) => {
  return createApiHandler(
    async () => {
      const result = await db.orgMember.delete({
        where: { id: memberId, organizationId },
      })
      return result
    },
    {
      authorizationCheck: async ({ user }) => {
        const isOwner = await userIsOwner({ organizationId, userId: user?.id })
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
