import { NextRequest, NextResponse } from 'next/server'

import { deleteOrgInvitation, userIsOwner } from '@/lib/db/queries/organization'

import { isAllowedServer } from '@/utils/auth'
import { FetchErrorCode, FetchResponse } from '@/utils/fetch'

export const DELETE = async (
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; inviteId: string }> },
) => {
  const { allowed } = await isAllowedServer()

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

  const { id: organizationId, inviteId } = await params

  const isOwner = await userIsOwner({ organizationId })

  if (!isOwner) {
    return NextResponse.json(
      {
        data: null,
        error: {
          code: FetchErrorCode.AUTH,
          message: 'Unauthorized to update this organization.',
        },
      } satisfies FetchResponse,
      { status: 403 },
    )
  }

  try {
    if (!inviteId || !organizationId) {
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

    const res = await deleteOrgInvitation(organizationId, {
      where: { id: inviteId, organizationId },
    })

    if (!res) {
      return NextResponse.json(
        {
          error: {
            code: FetchErrorCode.DATABASE_FAILURE,
            message: 'Failed to delete invitation.',
          },
        } satisfies FetchResponse,
        { status: 500 },
      )
    }

    return NextResponse.json(
      {
        data: {},
        message: 'Invitation deleted successfully.',
      } satisfies FetchResponse,
      { status: 200 },
    )
  } catch (error) {
    // eslint-disable-next-line no-console
    console.log(error)
  }
}
