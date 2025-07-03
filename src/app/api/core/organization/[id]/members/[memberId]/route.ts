import { OrgMember } from '@prisma/client'
import { NextRequest, NextResponse } from 'next/server'

import {
  deleteOrgMember,
  getOrgMember,
  userIsMember,
  userIsOwner,
} from '@/lib/db/queries/organization'

import { isAllowedServer } from '@/utils/auth'
import { FetchErrorCode, FetchResponse } from '@/utils/fetch'

export const GET = async (
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; memberId: string }> },
) => {
  const { allowed } = await isAllowedServer()

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

  const { id: organizationId, memberId } = await params

  const isMember = await userIsMember({ organizationId })

  if (!isMember) {
    return NextResponse.json(
      {
        data: null,
        error: {
          code: FetchErrorCode.AUTH,
          message: 'Unauthorized to view this organization.',
        },
      } satisfies FetchResponse,
      { status: 403 },
    )
  }

  try {
    if (!memberId || !organizationId) {
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

    const res = await getOrgMember(organizationId, {
      where: { id: memberId, organizationId },
      include: { user: true },
    })

    if (!res) {
      return NextResponse.json(
        {
          error: {
            code: FetchErrorCode.DATABASE_FAILURE,
            message: 'Failed to retrieve member data.',
          },
        } satisfies FetchResponse,
        { status: 500 },
      )
    }

    return NextResponse.json(
      {
        data: res,
      } satisfies FetchResponse<OrgMember>,
      { status: 200 },
    )
  } catch (error) {
    // eslint-disable-next-line no-console
    console.log(error)
  }
}

export const DELETE = async (
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; memberId: string }> },
) => {
  const { allowed } = await isAllowedServer()

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

  const { id: organizationId, memberId } = await params

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
    if (!memberId || !organizationId) {
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

    const res = await deleteOrgMember(organizationId, {
      where: { id: memberId, organizationId },
    })

    if (!res) {
      return NextResponse.json(
        {
          error: {
            code: FetchErrorCode.DATABASE_FAILURE,
            message: 'Failed to remove member from organization.',
          },
        } satisfies FetchResponse,
        { status: 500 },
      )
    }

    return NextResponse.json(
      {
        data: {},
        message: 'Member removed from organization successfully.',
      } satisfies FetchResponse,
      { status: 200 },
    )
  } catch (error) {
    // eslint-disable-next-line no-console
    console.log(error)
  }
}
