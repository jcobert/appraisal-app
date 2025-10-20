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
import { handleRegisterUser } from '@/lib/db/handlers/user-handlers'
import { userIsMember } from '@/lib/db/queries/organization'
import { orgMemberSchema } from '@/lib/db/schemas/org-member'

import { isExpired } from '@/utils/date'
import { isValidationSuccess, validatePayload } from '@/utils/zod'

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
    async ({ user }) => {
      // Validate payload
      const validation = validatePayload(orgMemberSchema.inviteToken, {
        ...payload,
        organizationId,
      })
      if (!isValidationSuccess(validation)) {
        throw new ValidationError(
          'Invalid data provided.',
          validation.errors || {},
        )
      }

      const { token, status } = validation.data

      const invitation = await db.orgInvitation.findUnique({
        where: { token, organizationId },
        select: {
          id: true,
          expires: true,
          status: true,
          organization: { select: { name: true, avatar: true } },
          invitedBy: {
            select: { firstName: true, lastName: true, email: true },
          },
          inviteeFirstName: true,
          inviteeLastName: true,
          inviteeEmail: true,
          roles: true,
        },
      })

      if (!invitation) {
        throw new NotFoundError('Invitation not found.')
      }

      // Token expired
      if (isExpired(invitation?.expires)) {
        await db.orgInvitation.update({
          where: { token, organizationId },
          data: { token: null, status: 'expired' },
          select: { id: true },
        })

        throw new NotFoundError('Invitation token expired.')
      }

      // User declined invitation
      if (status === 'declined') {
        await db.orgInvitation.update({
          where: { token, organizationId },
          data: { token: null, status: 'declined' },
          select: { id: true },
        })

        return {
          status: 'declined',
          message: 'Invitation declined successfully.',
        }
      }

      let userProfile = await db.user.findUnique({
        where: { accountId: user?.id },
        select: { id: true },
      })

      /**
       * User account but no profile (just created account while joining org).
       * Try to register profile automatically, but don't block org join if it fails.
       *
       * We gracefully handle profile registration failure because:
       * 1. The invitation should not be lost due to unrelated profile issues
       * 2. We can create profile later if needed
       * 3. Core org join functionality takes priority
       */
      if (user && !userProfile) {
        try {
          const registrationResult = await handleRegisterUser()
          userProfile = registrationResult?.data || null

          // Log successful auto-registration for monitoring
          if (userProfile) {
            // eslint-disable-next-line no-console
            console.info('Auto-registered user profile during org join:', {
              userId: userProfile?.id,
              invitation: invitation?.id,
            })
          }
        } catch (registrationError) {
          // Log the error but continue with org join process
          // eslint-disable-next-line no-console
          console.error(
            'Failed to auto-register user profile during org join:',
            {
              error: registrationError,
              userId: user?.id,
              invitation: invitation?.id,
            },
          )
        }
      }

      // Not allowed
      if (!user || !userProfile) {
        throw new AuthenticationError('User not authenticated.')
      }

      const isMember = await userIsMember({
        organizationId,
        accountId: user?.id,
      })

      // User already member of org
      if (isMember) {
        await db.orgInvitation.update({
          where: { token, organizationId },
          data: { token: null, status: 'accepted' },
          select: { id: true },
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
                    createdBy: userProfile?.id,
                    updatedBy: userProfile?.id,
                    userId: userProfile?.id,
                    active: true,
                    roles: invitation?.roles,
                  },
                ],
              },
            },
          },
        },
        select: { id: true },
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

        const { error: resendError } = await resend.emails.send(
          {
            from: 'PrizmaTrack <noreply@notifications.prizmatrack.com>',
            to: invitation?.invitedBy?.email,
            subject: orgInviteOwnerNotification({
              ...emailProps,
              format: 'short',
            }),
            react: <OrgInviteNotifyOwnerEmail {...emailProps} />,
          },
          { idempotencyKey: `org-join-owner-notification/${invitation?.id}` },
        )

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
