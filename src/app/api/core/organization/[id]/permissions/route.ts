import { NextRequest, NextResponse } from 'next/server'

import { getUserPermissions } from '@/lib/db/utils'

import { isAuthenticated } from '@/utils/auth'
import { FetchErrorCode, FetchResponse } from '@/utils/fetch'

export const GET = async (
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) => {
  const { allowed } = await isAuthenticated()

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
    const organizationId = (await params)?.id
    if (!organizationId) {
      return NextResponse.json(
        {
          error: {
            code: FetchErrorCode.INVALID_DATA,
            message: 'Missing organization ID.',
          },
          data: null,
        } satisfies FetchResponse,
        { status: 400 },
      )
    }

    const permissions = await getUserPermissions(organizationId)

    return NextResponse.json(
      {
        data: permissions,
      } satisfies FetchResponse,
      { status: 200 },
    )
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error fetching permissions:', error)
    return NextResponse.json(
      {
        error: {
          code: FetchErrorCode.FAILURE,
          message: 'Failed to fetch permissions.',
        },
        data: null,
      } satisfies FetchResponse,
      { status: 500 },
    )
  }
}
