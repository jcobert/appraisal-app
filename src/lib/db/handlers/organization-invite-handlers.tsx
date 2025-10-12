import { createApiHandler } from '../api-handlers'
import { OrgInvitationStatus } from '@prisma/client'
import { Resend } from 'resend'

import { db } from '@/lib/db/client'
import { ORG_INVITE_EXPIRY } from '@/lib/db/config'
import { NotFoundError, ValidationError } from '@/lib/db/errors'
import { userIsOwner } from '@/lib/db/queries/organization'
import { generateUniqueToken } from '@/lib/server-utils'

import { generateExpiry } from '@/utils/date'

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
      if (!organizationId) {
        throw new ValidationError('Organization ID is required', {})
      }

      if (!token) {
        throw new ValidationError('Token is required', {})
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
    async ({ user }) => {
      const { email, firstName, lastName, roles } = payload

      if (!email || !organizationId) {
        throw new ValidationError('Missing required fields.', {
          ...(email === '' || email === undefined
            ? { email: { code: 'too_small', message: 'Email is required' } }
            : {}),
          ...(organizationId === '' || organizationId === undefined
            ? {
                organizationId: {
                  code: 'too_small',
                  message: 'Organization ID is required',
                },
              }
            : {}),
        })
      }

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
        data: {
          createdBy: user?.id,
          updatedBy: user?.id,
          organizationId,
          invitedByUserId: activeUser?.id || '',
          inviteeEmail: email,
          inviteeFirstName: firstName,
          inviteeLastName: lastName,
          roles,
          expires,
          token: inviteToken,
        },
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
      if (!inviteId || !organizationId) {
        throw new ValidationError('Missing required fields.', {
          ...(inviteId === '' || inviteId === undefined
            ? {
                inviteId: {
                  code: 'too_small',
                  message: 'Invite ID is required',
                },
              }
            : {}),
          ...(organizationId === '' || organizationId === undefined
            ? {
                organizationId: {
                  code: 'too_small',
                  message: 'Organization ID is required',
                },
              }
            : {}),
        })
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
    async ({ user }) => {
      /** @todo Use zod schema validation. */
      if (!payload) {
        throw new ValidationError('Missing required fields.', {
          payload: { code: 'too_small', message: 'Payload is required' },
        })
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
        data: {
          inviteeFirstName: payload?.firstName,
          inviteeLastName: payload?.lastName,
          roles: payload?.roles,
          updatedBy: user?.id,
        },
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
