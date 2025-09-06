import { createApiHandler } from '../api-handlers'
import { Resend } from 'resend'

import { db } from '@/lib/db/client'
import { ORG_INVITE_EXPIRY } from '@/lib/db/config'
import { ValidationError } from '@/lib/db/errors'
import {
  getOrgInvitation,
  getOrganization,
  userIsOwner,
} from '@/lib/db/queries/organization'
import { getActiveUserProfile } from '@/lib/db/queries/user'
import { generateUniqueToken } from '@/lib/server-utils'

import { generateExpiry } from '@/utils/date'

import OrgInviteEmail from '@/components/email/org-invite-email'

import { OrgInvitePayload } from '@/features/organization/hooks/use-organization-invite'
import { getOrgInviteUrl } from '@/features/organization/utils'

const resend = new Resend(process.env.RESEND_API_KEY)

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

      const activeUser = await getActiveUserProfile()
      /**
       * @todo
       * Only org name is used in email,
       * so when replacing this with direct db call, only select name.
       */
      const org = await getOrganization({ organizationId })

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

      if (!invite) {
        throw new Error('Failed to create invitation.')
      }

      const inviteLink = getOrgInviteUrl({
        organizationId,
        inviteToken,
      })?.absolute

      const { error: resendError } = await resend.emails.send({
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
      })

      if (resendError) {
        throw new Error(
          `Failed to send invitation email: ${resendError.message}`,
        )
      }

      return invite
    },
    {
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
      authorizationCheck: async () => {
        const isOwner = await userIsOwner({ organizationId })
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

      const currentInvite = await getOrgInvitation({
        where: { id: inviteId, organizationId, status: 'pending' },
      })

      if (!currentInvite) {
        throw new Error('Invitation no longer pending. Ineligible to update.')
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
      authorizationCheck: async () => {
        const isOwner = await userIsOwner({ organizationId })
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
