import { Organization } from '@prisma/client'
import { NextRequest, NextResponse } from 'next/server'

import {
  deleteOrganization,
  getOrganization,
  updateOrganization,
  userIsOwner,
} from '@/lib/db/queries/organization'
import { organizationSchema } from '@/lib/db/schemas/organization'

import { isAuthenticated } from '@/utils/auth'
import { FetchErrorCode, FetchResponse } from '@/utils/fetch'
import { validatePayload } from '@/utils/zod'

// =============
//      GET
// =============
export const GET = async (
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) => {
  const { allowed } = await isAuthenticated()

  // No user
  if (!allowed) {
    return NextResponse.json(
      {
        error: {
          code: FetchErrorCode.AUTH,
          message: 'User not authenticated.',
        },
        data: null,
      } satisfies FetchResponse<Organization>,
      { status: 401 },
    )
  }

  // Not authorized
  // if (!isAuthorized) {
  //   return NextResponse.json(
  //     {
  //       error: { code: 'AUTH', message: 'User not authorized.' },
  //       data: null,
  //     } satisfies FetchResponse<Organization>,
  //     { status: 403 },
  //   )
  // }

  try {
    const organizationId = (await params)?.id
    const res = await getOrganization({ organizationId })

    /**
     * @todo
     * Identify alternate possibilities of res data structure for improved error handling/messaging.
     * Does primsa return an error object?
     * Would like to differentiate between db connection issue and bad payload.
     */

    // Not found
    if (!res) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: FetchErrorCode.NOT_FOUND,
            message: 'The requested organization could not be found.',
          },
        } satisfies FetchResponse<Organization>,
        { status: 404 },
      )
    }

    // Success
    return NextResponse.json(
      {
        data: res,
      } satisfies FetchResponse<Organization>,
      { status: 200 },
    )
  } catch (error) {
    // eslint-disable-next-line no-console
    console.log('\n\nError getting organization:\n', error)
    return NextResponse.json(
      {
        data: null,
        error: {
          code: FetchErrorCode.FAILURE,
          message: 'An unknown failure occurred.',
        },
      } satisfies FetchResponse<Organization>,
      { status: 500 },
    )
  }
}

// =============
//      PUT
// =============
export const PUT = async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) => {
  const { allowed, user } = await isAuthenticated()

  // No user
  if (!allowed) {
    return NextResponse.json(
      {
        error: {
          code: FetchErrorCode.AUTH,
          message: 'User not authenticated.',
        },
        data: null,
      } satisfies FetchResponse<Organization>,
      { status: 401 },
    )
  }

  try {
    const id = (await params)?.id

    // const isMember = await userIsMember({ organizationId: id })
    const isOwner = await userIsOwner({ organizationId: id })

    if (!isOwner) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: FetchErrorCode.AUTH,
            message: 'Unauthorized to update this organization.',
          },
        } satisfies FetchResponse<Organization>,
        { status: 403 },
      )
    }

    const payload = (await req.json()) as Organization

    const validation = validatePayload(organizationSchema.api, payload)

    // Bad data from client
    if (!validation?.success) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: FetchErrorCode.INVALID_DATA,
            message: 'Invalid data provided.',
            details: validation?.errors,
          },
        } satisfies FetchResponse<Organization>,
        { status: 400 },
      )
    }

    const res = await updateOrganization({
      organizationId: id,
      payload: { ...payload, updatedBy: user?.id },
    })

    // Server/database error
    if (!res) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: FetchErrorCode.DATABASE_FAILURE,
            message: 'The request was not successful.',
          },
        } satisfies FetchResponse<Organization>,
        { status: 500 },
      )
    }

    // Success
    return NextResponse.json(
      {
        data: null,
        message: 'Organization updated successfully.',
      } satisfies FetchResponse<Organization>,
      { status: 200 },
    )
  } catch (error) {
    // eslint-disable-next-line no-console
    console.log('\n\nError updating organization:\n', error)
    return NextResponse.json(
      {
        data: null,
        error: {
          code: FetchErrorCode.FAILURE,
          message: 'An unknown failure occurred.',
        },
      } satisfies FetchResponse<Organization>,
      { status: 500 },
    )
  }
}

// ==============
//     DELETE
// ==============
export const DELETE = async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) => {
  const { allowed } = await isAuthenticated()

  // No user
  if (!allowed) {
    return NextResponse.json(
      {
        error: {
          code: FetchErrorCode.AUTH,
          message: 'User not authenticated.',
        },
        data: null,
      } satisfies FetchResponse<Organization>,
      { status: 401 },
    )
  }

  try {
    const id = (await params)?.id

    // Bad data from client
    if (!id) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: FetchErrorCode.INVALID_DATA,
            message: 'Missing required fields.',
          },
        } satisfies FetchResponse<Organization>,
        { status: 400 },
      )
    }

    const res = await deleteOrganization({ organizationId: id })

    // Server/database error
    if (!res) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: FetchErrorCode.DATABASE_FAILURE,
            message: 'The request was not successful.',
          },
        } satisfies FetchResponse<Organization>,
        { status: 500 },
      )
    }

    // Success
    return NextResponse.json(
      {
        data: res,
        message: 'Organization deleted successfully.',
      } satisfies FetchResponse<Organization>,
      { status: 200 },
    )
  } catch (error) {
    // eslint-disable-next-line no-console
    console.log('\n\nError deleting organization:\n', error)
    return NextResponse.json(
      {
        data: null,
        error: {
          code: FetchErrorCode.FAILURE,
          message: 'An unknown failure occurred.',
        },
      } satisfies FetchResponse<Organization>,
      { status: 500 },
    )
  }
}
