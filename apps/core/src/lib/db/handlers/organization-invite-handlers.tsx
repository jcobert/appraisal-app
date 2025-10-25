import { createApiHandler, withUserFields } from '../api-handlers'
import { Resend } from 'resend'

import { OrgInvitationStatus } from '@repo/database'
import { generateExpiry } from '@repo/utils'

import { db } from '@/lib/db/client'
import { ORG_INVITE_EXPIRY } from '@/lib/db/config'
import { NotFoundError, ValidationError } from '@/lib/db/errors'
import { userIsOwner } from '@/lib/db/queries/organization'
import { orgMemberSchema } from '@/lib/db/schemas/org-member'
import { generateUniqueToken } from '@/lib/server-utils'

import { isValidationSuccess, validatePayload } from '@/utils/zod'

import OrgInviteEmail from '@/components/email/org-invite-email'

import { OrgInvitePayload } from '@/features/organization/hooks/use-organization-invite'
import { getOrgInviteUrl } from '@/features/organization/utils'

const resend = new Resend(process.env.RESEND_API_KEY)

/**
 * Get an organization invitation (public access).
 * Can be used in both API routes and server components.
 */
export const handleGetPublicOrgInvite = async ({
  organizationId,
  token,
  status,
}: {
  organizationId: string
  token: string
  status?: OrgInvitationStatus
}) => {
  return createApiHandler(
    async () => {
      // Validate input payload
      const validation = validatePayload(orgMemberSchema.inviteToken, {
        organizationId,
        token,
        status,
      })
      if (!isValidationSuccess(validation)) {
        throw new ValidationError(
          'Invalid data provided.',
          validation.errors || {},
        )
      }

      const result = await db.orgInvitation.findUnique({
        where: { organizationId, token, status },
        select: {
          organization: { select: { name: true, avatar: true } },
          invitedBy: true,
        },
      })

      return result
    },
    { dangerouslyBypassAuthentication: true },
  )
}

/**
 * Create an organization invitation (requires owner permissions).
 * Can be used in both API routes and server components.
 */
export const handleCreateOrgInvite = async (
  organizationId: string,
  payload: OrgInvitePayload,
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

      const { email, firstName, lastName, roles } = validation.data

      const activeUser = await db.user.findUnique({
        where: { accountId: user?.id },
        select: { id: true, firstName: true, lastName: true },
      })

      const org = await db.organization.findUnique({
        where: { id: organizationId },
        select: { name: true },
      })

      const inviteToken = generateUniqueToken()
      const expires = generateExpiry(ORG_INVITE_EXPIRY)

      const invite = await db.orgInvitation.create({
        data: withUserFields(
          {
            organizationId,
            invitedByUserId: activeUser?.id || '',
            inviteeEmail: email,
            inviteeFirstName: firstName,
            inviteeLastName: lastName,
            roles,
            expires,
            token: inviteToken,
          },
          userProfileId,
          ['createdBy', 'updatedBy'],
        ),
        select: { id: true },
      })

      const inviteLink = getOrgInviteUrl({
        organizationId,
        inviteToken,
      })?.absolute

      const { error: resendError } = await resend.emails.send(
        {
          from: 'PrizmaTrack <noreply@notifications.prizmatrack.com>',
          to: email,
          subject: "You've been invited to join an organization",
          react: (
            <OrgInviteEmail
              invitee={{ firstName, lastName }}
              inviter={{
                firstName: activeUser?.firstName || '',
                lastName: activeUser?.lastName || '',
              }}
              inviteLink={inviteLink}
              organization={org}
            />
          ),
        },
        { idempotencyKey: `org-invite/${inviteToken}` },
      )

      if (resendError) {
        // eslint-disable-next-line no-console
        console.error(
          'Failed to send invitation email:',
          `${resendError?.name} - ${resendError?.message}`,
        )
        throw new Error('Failure sending invitation email.')
      }

      return invite
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
        success: 'Invitation sent successfully.',
      },
      isMutation: true,
    },
  )
}

/**
 * Delete an organization invitation (requires owner permissions).
 * Can be used in both API routes and server components.
 */
export const handleDeleteOrgInvite = async (
  organizationId: string,
  inviteId: string,
) => {
  return createApiHandler(
    async () => {
      // Simple checks for required route parameters
      if (!organizationId) {
        throw new ValidationError('Organization ID is required.', {})
      }
      if (!inviteId) {
        throw new ValidationError('Invite ID is required.', {})
      }

      const res = await db.orgInvitation.delete({
        where: { id: inviteId, organizationId },
        select: { id: true, inviteeFirstName: true, inviteeLastName: true },
      })

      return res
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
        success: 'Invitation deleted successfully.',
      },
      isMutation: true,
    },
  )
}

/**
 * Update an organization invitation (requires owner permissions).
 * Can be used in both API routes and server components.
 */
export const handleUpdateOrgInvite = async (
  organizationId: string,
  inviteId: string,
  payload: OrgInvitePayload,
) => {
  return createApiHandler(
    async ({ userProfileId }) => {
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
      if (!inviteId) {
        throw new ValidationError('Invite ID is required.', {})
      }

      const currentInvite = await db.orgInvitation.findUnique({
        where: { id: inviteId, organizationId, status: 'pending' },
        select: { id: true },
      })

      if (!currentInvite?.id) {
        throw new NotFoundError('Invitation not found or no longer pending.')
      }

      const res = await db.orgInvitation.update({
        where: { id: inviteId, organizationId },
        data: withUserFields(
          {
            inviteeFirstName: validation.data.firstName,
            inviteeLastName: validation.data.lastName,
            roles: validation.data.roles,
          },
          userProfileId,
        ),
        select: { id: true },
      })

      return res
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
        success: 'Invitation updated successfully.',
      },
      isMutation: true,
    },
  )
}

export type CreateOrgInviteResult = Awaited<
  ReturnType<typeof handleCreateOrgInvite>
>
export type DeleteOrgInviteResult = Awaited<
  ReturnType<typeof handleDeleteOrgInvite>
>
export type UpdateOrgInviteResult = Awaited<
  ReturnType<typeof handleUpdateOrgInvite>
>
