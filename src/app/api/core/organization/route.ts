import { Organization } from '@prisma/client'
import { NextRequest, NextResponse } from 'next/server'

import {
  createOrganization,
  getUserOrganizations,
} from '@/lib/db/queries/organization'
import { getActiveUserProfile } from '@/lib/db/queries/user'

import { isAllowedServer } from '@/utils/auth'
import { FetchErrorCode, FetchResponse } from '@/utils/fetch'

// =============
//      GET
// =============
export const GET = async (_req: NextRequest) => {
  const { allowed } = await isAllowedServer()

  // No user
  if (!allowed) {
    return NextResponse.json(
      {
        error: {
          code: FetchErrorCode.AUTH,
          message: 'User not authenticated.',
        },
        data: null,
      } satisfies FetchResponse<Organization[]>,
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
    const res = await getUserOrganizations()
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
            message: 'No organizations found.',
          },
        } satisfies FetchResponse<Organization[]>,
        { status: 404 },
      )
    }

    // Success
    return NextResponse.json(
      {
        data: res,
      } satisfies FetchResponse<Organization[]>,
      { status: 200 },
    )
  } catch (error) {
    // eslint-disable-next-line no-console
    console.log('\n\nError getting organizations:\n', error)
    return NextResponse.json(
      {
        data: null,
        error: {
          code: FetchErrorCode.FAILURE,
          message: 'An unknown failure occurred.',
        },
      } satisfies FetchResponse<Organization[]>,
      { status: 500 },
    )
  }
}

// ==============
//      POST
// ==============
export const POST = async (req: NextRequest) => {
  const { allowed, user } = await isAllowedServer()

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
    const payload = (await req.json()) as Organization
    const { name } = payload

    const userProfile = await getActiveUserProfile()

    // Bad data from client
    if (!name) {
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

    // No user profile to link ownership to
    if (!userProfile?.id) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: FetchErrorCode.INVALID_DATA,
            message: 'No user profile found.',
          },
        } satisfies FetchResponse<Organization>,
        { status: 400 },
      )
    }

    const existingOrgs = await getUserOrganizations({
      owner: true,
      filter: { name: { equals: name, mode: 'insensitive' } },
    })

    // User already owns an org with the same name
    if (!!existingOrgs?.length) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: FetchErrorCode.DUPLICATE,
            message: 'An organization with this name already exists.',
          },
        } satisfies FetchResponse<Organization>,
        { status: 400 },
      )
    }

    const res = await createOrganization({
      data: {
        ...payload,
        ownerId: userProfile?.id,
        members: { connect: { id: userProfile?.id } },
        createdBy: user?.id,
        updatedBy: user?.id,
      },
    })

    /**
     * @todo
     * Identify alternate possibilities of res data structure for improved error handling/messaging.
     * Does primsa return an error object?
     * Would like to differentiate between db connection issue and bad payload.
     */

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
        message: 'Organization created successfully.',
      } satisfies FetchResponse<Organization>,
      { status: 201 },
    )
  } catch (error) {
    // eslint-disable-next-line no-console
    console.log('\n\nError creating organization:\n', error)
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
