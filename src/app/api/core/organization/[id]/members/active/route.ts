import { OrgMember } from '@prisma/client'
import { NextRequest, NextResponse } from 'next/server'

import {
  updateOrgMember,
  userIsOwner,
} from '@/lib/db/queries/organization'
import { handleGetActiveUserOrgMember } from '@/lib/db/handlers/organization-member-handlers'
import { toNextResponse } from '@/lib/api-handlers'

import { isAuthenticated } from '@/utils/auth'
import { FetchErrorCode, FetchResponse } from '@/utils/fetch'

export const GET = async (
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) => {
  const { id: organizationId } = await params
  const result = await handleGetActiveUserOrgMember(organizationId)
  return toNextResponse(result)
}

export const PUT = async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string; memberId: string }> },
) => {
  const { allowed, user } = await isAuthenticated()

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

  try {
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

    const payload = (await req.json()) as OrgMember

    // const validation = validatePayload(orgMemberSchema.api, payload)

    // Bad data from client
    // if (!validation?.success) {
    //   return NextResponse.json(
    //     {
    //       data: null,
    //       error: {
    //         code: FetchErrorCode.INVALID_DATA,
    //         message: 'Invalid data provided.',
    //         details: validation?.errors,
    //       },
    //     } satisfies FetchResponse<OrgMember>,
    //     { status: 400 },
    //   )
    // }

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

    const res = await updateOrgMember({
      organizationId,
      memberId,
      payload: { ...payload, updatedBy: user?.id },
    })

    if (!res) {
      return NextResponse.json(
        {
          error: {
            code: FetchErrorCode.DATABASE_FAILURE,
            message: 'Failed to update member.',
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
