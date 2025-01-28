import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server'
import { User } from '@prisma/client'
import { NextRequest, NextResponse } from 'next/server'

import { db } from '@/lib/db/client'

import { FetchErrorCode, FetchResponse } from '@/utils/fetch'

// =============
//      GET
// =============
export const GET = async (_req: NextRequest) => {
  const { getUser, isAuthenticated } = getKindeServerSession()

  const user = await getUser()
  const isLoggedIn = await isAuthenticated()

  // No user
  if (!isLoggedIn || !user) {
    return NextResponse.json(
      {
        error: {
          code: FetchErrorCode.AUTH,
          message: 'User not authenticated.',
        },
        data: null,
      } satisfies FetchResponse<User[]>,
      { status: 401 },
    )
  }

  // Not authorized
  // if (!isAuthorized) {
  //   return NextResponse.json(
  //     {
  //       error: { code: 'AUTH', message: 'User not authorized.' },
  //       data: null,
  //     } satisfies FetchResponse<User>,
  //     { status: 403 },
  //   )
  // }

  try {
    const res = await db.user.findMany()

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
        } satisfies FetchResponse<User[]>,
        { status: 500 },
      )
    }

    // Success
    return NextResponse.json(
      {
        data: res,
      } satisfies FetchResponse<User[]>,
      { status: 200 },
    )
  } catch (error) {
    // eslint-disable-next-line no-console
    console.log('\n\nError getting users:\n', error)
    return NextResponse.json(
      {
        data: null,
        error: {
          code: FetchErrorCode.FAILURE,
          message: 'An unknown failure occurred.',
        },
      } satisfies FetchResponse<User[]>,
      { status: 500 },
    )
  }
}

// ==============
//      POST
// ==============
export const POST = async (req: NextRequest) => {
  const { getUser, isAuthenticated } = getKindeServerSession()

  const user = await getUser()
  const isLoggedIn = await isAuthenticated()

  // No user
  if (!isLoggedIn || !user) {
    return NextResponse.json(
      {
        error: {
          code: FetchErrorCode.AUTH,
          message: 'User not authenticated.',
        },
        data: null,
      } satisfies FetchResponse<User>,
      { status: 401 },
    )
  }

  // Not authorized
  // if (!isAuthorized) {
  //   return NextResponse.json(
  //     {
  //       error: { code: 'AUTH', message: 'User not authorized.' },
  //       data: null,
  //     } satisfies FetchResponse<User>,
  //     { status: 403 },
  //   )
  // }

  try {
    const payload = (await req.json()) as User
    const { firstName, lastName } = payload

    // Bad data from client
    if (!firstName || !lastName)
      return NextResponse.json(
        {
          data: null,
          error: {
            code: FetchErrorCode.INVALID_DATA,
            message: 'Missing required fields.',
          },
        } satisfies FetchResponse<User>,
        { status: 400 },
      )

    const res = await db.user.create({
      data: { ...payload, createdBy: user?.id, updatedBy: user?.id },
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
        } satisfies FetchResponse<User>,
        { status: 500 },
      )
    }

    // Success
    return NextResponse.json(
      {
        data: null,
        message: 'User created successfully.',
      } satisfies FetchResponse<User>,
      { status: 201 },
    )
  } catch (error) {
    // eslint-disable-next-line no-console
    console.log('\n\nError creating user:\n', error)
    return NextResponse.json(
      {
        data: null,
        error: {
          code: FetchErrorCode.FAILURE,
          message: 'An unknown failure occurred.',
        },
      } satisfies FetchResponse<User>,
      { status: 500 },
    )
  }
}
