import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server'
import { User } from '@prisma/client'
import { NextRequest, NextResponse } from 'next/server'

import { toNextResponse } from '@/lib/db/api-handlers'
import { db } from '@/lib/db/client'
import { handleGetActiveUser } from '@/lib/db/handlers/user-handlers'
import { userProfileSchema } from '@/lib/db/schemas/user'
import {
  updateAuthAccount,
  updateAuthEmail,
} from '@/lib/kinde-management/queries'

import { FetchErrorCode, FetchResponse } from '@/utils/fetch'
import { validatePayload } from '@/utils/zod'

import { getProfileChanges } from '@/features/user/utils'

// =============
//      GET
// =============
export const GET = async (_req: NextRequest) => {
  const result = await handleGetActiveUser()
  return toNextResponse(result)
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
          code: FetchErrorCode.NOT_AUTHENTICATED,
          message: 'User not authenticated.',
        },
        data: null,
      } satisfies FetchResponse<User>,
      { status: 401 },
    )
  }

  try {
    const payload = (await req.json()) as User

    // Not authorized
    if (payload?.accountId !== user.id) {
      return NextResponse.json(
        {
          error: { code: FetchErrorCode.NOT_AUTHORIZED, message: 'User not authorized.' },
          data: null,
        } satisfies FetchResponse<User>,
        { status: 403 },
      )
    }

    const validation = validatePayload(userProfileSchema.api, payload)

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
        } satisfies FetchResponse<User>,
        { status: 400 },
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
          code: FetchErrorCode.INTERNAL_ERROR,
          message: 'An unknown failure occurred.',
        },
      } satisfies FetchResponse<User>,
      { status: 500 },
    )
  }
}
