import { createApiHandler } from '../api-handlers'
import { Resend } from 'resend'

import { ORG_INVITE_EXPIRY } from '@/lib/db/config'
import { ValidationError } from '@/lib/db/errors'
import {
  createOrgInvitation,
  getOrganization,
} from '@/lib/db/queries/organization'
import { getActiveUserProfile } from '@/lib/db/queries/user'
import { generateUniqueToken } from '@/lib/server-utils'

import { generateExpiry } from '@/utils/date'

import OrgInviteEmail from '@/components/email/org-invite-email'

import { OrgInvitePayload } from '@/features/organization/hooks/use-organization-invite'
import { getOrgInviteUrl } from '@/features/organization/utils'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function handleCreateOrgInvite(
  organizationId: string,
  payload: OrgInvitePayload,
) {
  return createApiHandler(
    async ({ user }) => {
      const { email, firstName, lastName, roles } = payload

      if (!email || !organizationId) {
        throw new ValidationError('Missing required fields.', {
          ...(email === '' || email === undefined
            ? { email: { code: 'too_small', message: 'Email is required' } }
            : {}),
          ...(organizationId === '' || organizationId === undefined
            ? { organizationId: { code: 'too_small', message: 'Organization ID is required' } }
            : {}),
        })
      }

      const activeUser = await getActiveUserProfile()
      const org = await getOrganization({ organizationId })

      const inviteToken = generateUniqueToken()
      const expires = generateExpiry(ORG_INVITE_EXPIRY)

      const invite = await createOrgInvitation({
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

      return { success: true }
    },
    {
      messages: {
        success: 'Invitation sent successfully.',
      },
      isMutation: true,
    },
  )
}
