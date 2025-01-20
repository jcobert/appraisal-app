import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server'
import { Appraiser } from '@prisma/client'
import { NextRequest, NextResponse } from 'next/server'

import { db } from '@/lib/db/client'

import { FetchResponse } from '@/utils/fetch'

export const POST = async (req: NextRequest) => {
  const { getUser, isAuthenticated } = getKindeServerSession()

  const user = await getUser()
  const isLoggedIn = await isAuthenticated()

  // No user
  if (!isLoggedIn || !user) {
    return NextResponse.json(
      {
        error: { code: 'AUTH', message: 'User not authenticated.' },
        data: null,
      } satisfies FetchResponse<Appraiser>,
      { status: 401 },
    )
  }

  // Not authorized
  // if (!isAuthorized) {
  //   return NextResponse.json(
  //     {
  //       error: { code: 'AUTH', message: 'User not authorized.' },
  //       data: null,
  //     } satisfies FetchResponse<Appraiser>,
  //     { status: 403 },
  //   )
  // }

  try {
    const payload = (await req.json()) as Appraiser
    const { firstName, lastName } = payload

    // Bad data from client
    if (!firstName || !lastName)
      return NextResponse.json(
        {
          data: null,
          error: { code: 'INVALID_DATA', message: 'Missing required fields.' },
        } satisfies FetchResponse<Appraiser>,
        { status: 400 },
      )

    const res = await db.appraiser.create({
      data: { ...payload, createdBy: user?.id, updatedBy: user?.id },
    })

    /**
     * @todo
     * Identify alternate res data structure for improved error handling/messaging.
     * Does primsa return an error object?
     * Would like to differentiate between db connection issue and bad payload.
     */

    // Server/database error
    if (!res) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: 'DATABASE_FAILURE',
            message: 'The request was not successful.',
          },
        } satisfies FetchResponse<Appraiser>,
        { status: 500 },
      )
    }

    // Success
    return NextResponse.json(
      {
        data: null,
        message: 'Appraiser created successfully.',
      } satisfies FetchResponse<Appraiser>,
      { status: 201 },
    )
  } catch (error) {
    // eslint-disable-next-line no-console
    console.log('\n\nError creating appraiser:\n', error)
    return NextResponse.json(
      {
        data: null,
        error: {
          code: 'FAILURE',
          message: 'An unknown failure occurred.',
        },
      } satisfies FetchResponse<Appraiser>,
      { status: 500 },
    )
  }
}
