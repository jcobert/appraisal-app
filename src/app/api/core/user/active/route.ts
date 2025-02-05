import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server'
import { User } from '@prisma/client'
import { NextRequest, NextResponse } from 'next/server'

import { db } from '@/lib/db/client'
import {
  updateAuthAccount,
  updateAuthEmail,
} from '@/lib/kinde-management/queries'

import { FetchErrorCode, FetchResponse } from '@/utils/fetch'

import { getProfileChanges } from '@/components/features/user/utils'

// =============
//      GET
// =============
export const GET = async (_req: NextRequest) => {
  const { getUser, isAuthenticated } = getKindeServerSession()

  const user = await getUser()
  const isLoggedIn = await isAuthenticated()

  // No user
  if (!isLoggedIn || !user?.id) {
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
    const res = await db.user.findUnique({ where: { accountId: user.id } })

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
            message: 'The requested user could not be found.',
          },
        } satisfies FetchResponse<User>,
        { status: 404 },
      )
    }

    // Success
    return NextResponse.json(
      {
        data: res,
      } satisfies FetchResponse<User>,
      { status: 200 },
    )
  } catch (error) {
    // eslint-disable-next-line no-console
    console.log('\n\nError getting user:\n', error)
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

// ==============
//      POST
// ==============
export const POST = async (req: NextRequest) => {
  const { getUser, isAuthenticated } = getKindeServerSession()

  const user = await getUser()
  const isLoggedIn = await isAuthenticated()

  // No user
  if (!isLoggedIn || !user?.id) {
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
  //       error: { code: FetchErrorCode.AUTH, message: 'User not authorized.' },
  //       data: null,
  //     } satisfies FetchResponse<User>,
  //     { status: 403 },
  //   )
  // }

  try {
    const payload = (await req.json()) as User
    const { accountId } = payload

    // // Bad data from client
    if (!accountId) {
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
    }

    // Not authorized
    if (accountId !== user.id) {
      return NextResponse.json(
        {
          error: { code: FetchErrorCode.AUTH, message: 'User not authorized.' },
          data: null,
        } satisfies FetchResponse<User>,
        { status: 403 },
      )
    }

    const res = await db.user.create({
      data: {
        ...payload,
        email: payload?.email || user?.email,
        accountId: user.id,
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

// =============
//      PUT
// =============
export const PUT = async (req: NextRequest) => {
  const { getUser, isAuthenticated, refreshTokens } = getKindeServerSession()

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

  try {
    const { accountId, ...payload } = (await req.json()) as User

    // Bad data from client
    if (!accountId) {
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
    }

    // Not authorized
    if (accountId !== user.id) {
      return NextResponse.json(
        {
          error: { code: FetchErrorCode.AUTH, message: 'User not authorized.' },
          data: null,
        } satisfies FetchResponse<User>,
        { status: 403 },
      )
    }

    const changes = getProfileChanges({
      account: user,
      profile: payload,
    })

    // Apply email update to account record
    if (!!changes?.email) {
      const accountUpdate = await updateAuthEmail(
        payload?.email || changes?.email,
      )
      if (!accountUpdate) {
        return NextResponse.json(
          {
            data: null,
            error: {
              code: FetchErrorCode.DATABASE_FAILURE,
              message: 'Account could not be updated.',
            },
          } satisfies FetchResponse<User>,
          { status: 500 },
        )
      }
      // Refresh session data after successful email update
      await refreshTokens()
    }

    // Apply name update to account record
    if (!!changes?.firstName || !!changes?.lastName) {
      const accountUpdate = await updateAuthAccount({
        given_name: payload?.firstName,
        family_name: payload?.lastName,
      })
      if (!accountUpdate) {
        return NextResponse.json(
          {
            data: null,
            error: {
              code: FetchErrorCode.DATABASE_FAILURE,
              message: 'User account could not be updated.',
            },
          } satisfies FetchResponse<User>,
          { status: 500 },
        )
      }
      // Refresh session data after successful email update
      await refreshTokens()
    }

    const res = await db.user.update({
      where: { accountId: user.id },
      data: {
        ...payload,
        email: payload?.email || user?.email,
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
            message: 'User profile could not be updated.',
          },
        } satisfies FetchResponse<User>,
        { status: 500 },
      )
    }

    // Success
    return NextResponse.json(
      {
        data: null,
        message: 'User updated successfully.',
      } satisfies FetchResponse<User>,
      { status: 200 },
    )
  } catch (error) {
    // eslint-disable-next-line no-console
    console.log('\n\nError updating user:\n', error)
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
