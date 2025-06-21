import { OrgInvitation, OrgInvitationStatus } from '@prisma/client'
import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

import {
  createOrgInvitation,
  getOrgInvitation,
  getOrganization,
  updateOrgInvitation,
} from '@/lib/db/queries/organization'
import { getActiveUserProfile } from '@/lib/db/queries/user'
import { generateUniqueToken } from '@/lib/server-utils'

import { isAllowedServer } from '@/utils/auth'
import { generateExpiry, isExpired } from '@/utils/date'
import { FetchErrorCode, FetchResponse } from '@/utils/fetch'
import { fullName } from '@/utils/string'

import OrgInviteEmail from '@/components/email/org-invite-email'

import { EmailPayload } from '@/features/organization/hooks/use-organization-invite'

const resend = new Resend(process.env.RESEND_API_KEY)

export const POST = async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) => {
  // const { allowed } = await isAllowedServer()

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

    const activeUser = await getActiveUserProfile()

    // Not allowed
    if (!activeUser) {
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

    const updatedInvitation = await updateOrgInvitation({
      where: { token, organizationId },
      data: {
        token: null,
        status: 'accepted',
        organization: {
          update: {
            members: {
              create: [
                {
                  userId: activeUser?.id,
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
      const { error: resendError } = await resend.emails.send({
        from: 'PrizmaTrack <noreply@notifications.prizmatrack.com>',
        to: invitation?.invitedBy?.email,
        subject: `${fullName(invitation?.inviteeFirstName, invitation?.inviteeLastName)} accepted your invitation.`,
        /** @todo Add email template. */
        text: '',
      })
    }

    // if (resendError) {
    //   return NextResponse.json(
    //     {
    //       error: {
    //         code: resendError?.name as FetchErrorCode,
    //         message: resendError?.message,
    //       },
    //     } satisfies FetchResponse,
    //     { status: 500 },
    //   )
    // }

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
