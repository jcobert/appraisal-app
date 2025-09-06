import { createApiHandler } from '../api-handlers'
import { OrgInvitationStatus } from '@prisma/client'
import { ComponentPropsWithoutRef } from 'react'
import { Resend } from 'resend'

import { db } from '@/lib/db/client'
import {
  AuthenticationError,
  DatabaseConstraintError,
  NotFoundError,
  ValidationError,
} from '@/lib/db/errors'
import { getOrgInvitation, userIsMember } from '@/lib/db/queries/organization'
import {
  getActiveUserProfile,
  registerUserProfile,
} from '@/lib/db/queries/user'

import { getActiveUserAccount } from '@/utils/auth'
import { isExpired } from '@/utils/date'

import OrgInviteNotifyOwnerEmail, {
  orgInviteOwnerNotification,
} from '@/components/email/org-invite-notify-owner-email'

const resend = new Resend(process.env.RESEND_API_KEY)

export type OrgJoinPayload = {
  token: string
  status?: OrgInvitationStatus
}

/**
 * Handle organization invitation acceptance or decline.
 * Can be used in both API routes and server components.
 */
export async function handleJoinOrganization(
  organizationId: string,
  payload: OrgJoinPayload,
) {
  return createApiHandler(
    async () => {
      const { token, status } = payload

      if (!token) {
        throw new ValidationError('Missing required fields.', {
          token: { code: 'too_small', message: 'Invite token is required' },
        })
      }

      if (!organizationId) {
        throw new ValidationError('Missing required fields.', {
          organizationId: {
            code: 'too_small',
            message: 'Organization ID is required',
          },
        })
      }

      const invitation = await getOrgInvitation(
        {
          where: { token, organizationId },
        },
        { publicAccess: true },
      )

      if (!invitation) {
        throw new NotFoundError('Invitation not found.')
      }

      // Token expired
      if (isExpired(invitation?.expires)) {
        await db.orgInvitation.update({
          where: { token, organizationId },
          data: { token: null, status: 'expired' },
        })

        throw new NotFoundError('Invitation token expired.')
      }

      // User declined invitation
      if (status === 'declined') {
        await db.orgInvitation.update({
          where: { token, organizationId },
          data: { token: null, status: 'declined' },
        })

        return {
          status: 'declined',
          message: 'Invitation declined successfully.',
        }
      }

      const userAccount = await getActiveUserAccount()
      let userProfile = await getActiveUserProfile()

      // User account but no profile (just created acct while joining org).
      // Register profile automatically.
      if (userAccount && !userProfile) {
        const registeredProfile = await registerUserProfile({
          redirectIfExists: false,
        })
        userProfile = registeredProfile || null
      }

      // Not allowed
      if (!userAccount || !userProfile) {
        throw new AuthenticationError('User not authenticated.')
      }

      // User already member of org
      if (await userIsMember({ organizationId })) {
        await db.orgInvitation.update({
          where: { token, organizationId },
          data: { token: null, status: 'accepted' },
        })

        throw new DatabaseConstraintError(
          'User already member of organization.',
          'unique',
          'userId',
        )
      }

      const updatedInvitation = await db.orgInvitation.update({
        where: { token, organizationId },
        data: {
          updatedBy: userProfile?.id,
          token: null,
          status: 'accepted',
          organization: {
            update: {
              members: {
                create: [
                  {
                    createdBy: userAccount?.id,
                    updatedBy: userAccount?.id,
                    userId: userProfile?.id,
                    active: true,
                    roles: invitation?.roles,
                  },
                ],
              },
            },
          },
        },
      })

      if (!updatedInvitation) {
        throw new Error('Failed to update invitation status.')
      }

      // Send notification email to the person who sent the invitation.
      if (invitation?.invitedBy?.email) {
        const emailProps = {
          invitee: {
            firstName: invitation?.inviteeFirstName || '',
            lastName: invitation?.inviteeLastName || '',
            email: invitation?.inviteeEmail,
          },
          inviter: {
            firstName: invitation?.invitedBy?.firstName,
            lastName: invitation?.invitedBy?.lastName,
          },
          organization: invitation?.organization,
          status: status || 'accepted',
        } satisfies ComponentPropsWithoutRef<typeof OrgInviteNotifyOwnerEmail>

        const { error: resendError } = await resend.emails.send({
          from: 'PrizmaTrack <noreply@notifications.prizmatrack.com>',
          to: invitation?.invitedBy?.email,
          subject: orgInviteOwnerNotification({
            ...emailProps,
            format: 'short',
          }),
          react: <OrgInviteNotifyOwnerEmail {...emailProps} />,
        })

        if (resendError) {
          // Log error but don't fail the operation since the core functionality succeeded.
          // eslint-disable-next-line no-console
          console.error(
            'Failed to send notification email:',
            resendError.message,
          )
        }
      }

      return {
        status: 'accepted',
        message: 'Successfully joined organization.',
      }
    },
    {
      dangerouslyBypassAuthentication: true, // We handle auth manually since it's more complex
      messages: {
        success: 'Invitation processed successfully.',
      },
      isMutation: true,
    },
  )
}

export type JoinOrganizationResult = Awaited<
  ReturnType<typeof handleJoinOrganization>
>
