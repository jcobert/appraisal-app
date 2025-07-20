import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

import {
  createOrgInvitation,
  getOrganization,
} from '@/lib/db/queries/organization'
import { getActiveUserProfile } from '@/lib/db/queries/user'
import { generateUniqueToken } from '@/lib/server-utils'

import { isAllowedServer } from '@/utils/auth'
import { generateExpiry } from '@/utils/date'
import { FetchErrorCode, FetchResponse } from '@/utils/fetch'

import OrgInviteEmail from '@/components/email/org-invite-email'

import { OrgInvitePayload } from '@/features/organization/hooks/use-organization-invite'
import { getOrgInviteUrl } from '@/features/organization/utils'

const resend = new Resend(process.env.RESEND_API_KEY)

export const POST = async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) => {
  const { allowed, user } = await isAllowedServer()

  // Not allowed
  if (!allowed) {
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

  const organizationId = (await params)?.id

  try {
    const { email, firstName, lastName, roles } =
      (await req.json()) as OrgInvitePayload

    if (!email || !organizationId) {
      return NextResponse.json(
        {
          error: {
            code: FetchErrorCode.INVALID_DATA,
            message: 'Missing required fields.',
          },
        } satisfies FetchResponse,
        { status: 400 },
      )
    }

    const activeUser = await getActiveUserProfile()
    const org = await getOrganization({ organizationId })

    const inviteToken = generateUniqueToken()
    const expires = generateExpiry(7)

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
      return NextResponse.json(
        {
          error: {
            code: FetchErrorCode.DATABASE_FAILURE,
            message: 'Failed to create invitation.',
          },
        } satisfies FetchResponse,
        { status: 500 },
      )
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
      return NextResponse.json(
        {
          error: {
            code: resendError?.name as FetchErrorCode,
            message: resendError?.message,
          },
        } satisfies FetchResponse,
        { status: 500 },
      )
    }

    return NextResponse.json({} satisfies FetchResponse)
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
