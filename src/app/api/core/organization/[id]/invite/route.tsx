import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

import { getOrganization } from '@/lib/db/queries/organization'

import { isAllowedServer } from '@/utils/auth'
import { FetchErrorCode, FetchResponse } from '@/utils/fetch'

import OrgInviteEmail from '@/components/email/org-invite-email'

import { EmailPayload } from '@/features/organization/hooks/use-organization-invite'

const resend = new Resend(process.env.RESEND_API_KEY)

export const POST = async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) => {
  const { allowed, user } = await isAllowedServer()

  const organizationId = (await params)?.id

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

  try {
    const { email, firstName, lastName } = (await req.json()) as EmailPayload

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

    const org = await getOrganization({ where: { id: organizationId } })

    /** @todo Figure out where to link. */
    const inviteLink = `${process.env.NEXT_PUBLIC_SITE_BASE_URL}/organizations/${organizationId}`

    const { data, error } = await resend.emails.send({
      from: 'PrizmaTrack <noreply@notifications.prizmatrack.com>',
      to: email,
      subject: "You've been invited to join an organization",
      react: (
        <OrgInviteEmail
          invitee={{ firstName, lastName }}
          inviter={{
            firstName: user?.given_name || '',
            lastName: user?.family_name || '',
          }}
          inviteLink={inviteLink}
          organization={org}
        />
      ),
    })

    if (error) {
      return NextResponse.json(
        {
          error: {
            code: error?.name as FetchErrorCode,
            message: error?.message,
          },
        } satisfies FetchResponse,
        { status: 500 },
      )
    }

    return NextResponse.json({ data } satisfies FetchResponse)
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
