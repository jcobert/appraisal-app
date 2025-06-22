import { OrgInvitation } from '@prisma/client'
import { NextRequest, NextResponse } from 'next/server'
import { ComponentPropsWithoutRef } from 'react'
import { Resend } from 'resend'

import {
  getOrgInvitation,
  updateOrgInvitation,
  userIsMember,
} from '@/lib/db/queries/organization'
import {
  getActiveUserProfile,
  registerUserProfile,
} from '@/lib/db/queries/user'

import { getActiveUserAccount } from '@/utils/auth'
import { isExpired } from '@/utils/date'
import { FetchErrorCode, FetchResponse } from '@/utils/fetch'

import OrgInviteNotifyOwnerEmail, {
  orgInviteOwnerNotification,
} from '@/components/email/org-invite-notify-owner-email'

const resend = new Resend(process.env.RESEND_API_KEY)

export const POST = async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) => {
  const userAccount = await getActiveUserAccount()

  const organizationId = (await params)?.id

  try {
    const { token, status } = (await req.json()) as OrgInvitation

    if (!token) {
      return NextResponse.json(
        {
          error: {
            code: FetchErrorCode.INVALID_DATA,
            message: 'Missing invite token.',
          },
        } satisfies FetchResponse,
        { status: 400 },
      )
    }

    const invitation = await getOrgInvitation(
      {
        where: { token, organizationId },
      },
      { publicAccess: true },
    )

    if (!invitation) {
      return NextResponse.json(
        {
          error: {
            code: FetchErrorCode.NOT_FOUND,
            message: 'Invitation not found.',
          },
        } satisfies FetchResponse,
        { status: 404 },
      )
    }

    // Token expired
    if (isExpired(invitation?.expires)) {
      await updateOrgInvitation({
        where: { token, organizationId },
        data: { token: null, status: 'expired' },
      })

      return NextResponse.json(
        {
          error: {
            code: FetchErrorCode.NOT_FOUND,
            message: 'Invitation token expired.',
          },
        } satisfies FetchResponse,
        { status: 404 },
      )
    }

    // User declined invitation
    if (status === 'declined') {
      await updateOrgInvitation({
        where: { token, organizationId },
        data: { token: null, status: 'declined' },
      })

      return NextResponse.json({}, { status: 200 })
    }

    let userProfile:
      | Awaited<ReturnType<typeof getActiveUserProfile>>
      | undefined = await getActiveUserProfile()

    // User account but no profile (just created acct while joining org).
    // Register profile automatically.
    if (userAccount && !userProfile) {
      userProfile = await registerUserProfile({ redirectIfExists: false })
    }

    // Not allowed
    if (!userAccount || !userProfile) {
      return NextResponse.json(
        {
          error: {
            code: FetchErrorCode.AUTH,
            message: 'User not authenticated.',
          },
          data: null,
        } satisfies FetchResponse,
        { status: 401 },
      )
    }

    // User already member of org
    if (await userIsMember({ organizationId })) {
      await updateOrgInvitation({
        where: { token, organizationId },
        data: { token: null, status: 'accepted' },
      })
      return NextResponse.json(
        {
          error: {
            code: FetchErrorCode.DUPLICATE,
            message: 'User already member of organization.',
          },
          data: null,
          status: 409,
        } satisfies FetchResponse,
        { status: 409 },
      )
    }

    const updatedInvitation = await updateOrgInvitation({
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
                  userId: userProfile?.id,
                  active: true,
                  /** @todo Add roles when invitation created? */
                  // roles: ['']
                },
              ],
            },
          },
        },
      },
    })

    if (!updatedInvitation) {
      return NextResponse.json(
        {
          error: {
            code: FetchErrorCode.DATABASE_FAILURE,
            message: 'Failed to update invitation status.',
          },
        } satisfies FetchResponse,
        { status: 500 },
      )
    }

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
        status,
      } satisfies ComponentPropsWithoutRef<typeof OrgInviteNotifyOwnerEmail>

      const { error: _resendError } = await resend.emails.send({
        from: 'PrizmaTrack <noreply@notifications.prizmatrack.com>',
        to: invitation?.invitedBy?.email,
        subject: orgInviteOwnerNotification({ ...emailProps, format: 'short' }),
        react: <OrgInviteNotifyOwnerEmail {...emailProps} />,
      })
    }

    return NextResponse.json({})
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error)
    return NextResponse.json(
      {
        error: { code: FetchErrorCode.FAILURE },
      } satisfies FetchResponse,
      { status: 500 },
    )
  }
}
