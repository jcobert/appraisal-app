import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server'
import { User } from '@prisma/client'
import { NextRequest, NextResponse } from 'next/server'

import { db } from '@/lib/db/client'
import { userProfileSchema } from '@/lib/db/schemas/user'
import { handleGetUsers } from '@/lib/db/handlers/user-handlers'
import { toNextResponse } from '@/lib/api-handlers'

import { FetchErrorCode, FetchResponse } from '@/utils/fetch'
import { validatePayload } from '@/utils/zod'

// =============
//      GET
// =============
export const GET = async (_req: NextRequest) => {
  const result = await handleGetUsers()
  return toNextResponse(result)
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

    const res = await db.user.create({
      data: { ...payload, createdBy: user?.id, updatedBy: user?.id },
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
