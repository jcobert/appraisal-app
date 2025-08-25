import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server'
import { User } from '@prisma/client'
import { NextRequest, NextResponse } from 'next/server'

import { toNextResponse } from '@/lib/api-handlers'
import {
  handleCreateUser,
  handleGetUsers,
} from '@/lib/db/handlers/user-handlers'

import { FetchErrorCode, FetchResponse } from '@/utils/fetch'

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
    const payload = (await req.json()) as User

    const result = await handleCreateUser({
      ...payload,
      createdBy: user.id,
      updatedBy: user.id,
    })

    return toNextResponse(result)
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
