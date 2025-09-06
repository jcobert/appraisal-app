import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server'
import { User } from '@prisma/client'
import { NextRequest, NextResponse } from 'next/server'

import { db } from '@/lib/db/client'

import { FetchErrorCode, FetchResponse } from '@/utils/fetch'

// ==============
//      POST
// ==============
export const POST = async (_req: NextRequest) => {
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

  try {
    const currentProfile = await db.user.findUnique({
      where: { accountId: user.id },
    })

    // Error - profile already exists
    if (!!currentProfile?.id) {
      return NextResponse.json(
        {
          error: {
            code: FetchErrorCode.INTERNAL_ERROR,
            message: 'User profile already exists.',
          },
          data: null,
        } satisfies FetchResponse<User>,
        { status: 400 },
      )
    }

    const res = await db.user.create({
      data: {
        accountId: user?.id,
        createdBy: user?.id,
        updatedBy: user?.id,
        firstName: user?.given_name || '',
        lastName: user?.family_name || '',
        avatar: user?.picture,
        email: user?.email,
        phone: user?.phone_number,
      },
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
        message: 'User profile created successfully.',
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
          code: FetchErrorCode.INTERNAL_ERROR,
          message: 'An unknown failure occurred.',
        },
      } satisfies FetchResponse<User>,
      { status: 500 },
    )
  }
}
