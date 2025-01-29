import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server'
import { Organization } from '@prisma/client'
import { NextRequest, NextResponse } from 'next/server'

import { db } from '@/lib/db/client'
import { getUserOrganizations } from '@/lib/db/operations/organization'

import { FetchErrorCode, FetchResponse } from '@/utils/fetch'

// =============
//      GET
// =============
export const GET = async (
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) => {
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
    const id = (await params)?.id
    const res = await db.organization.findUnique({
      where: { id, members: { some: { accountId: user?.id } } },
    })

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
    const id = (await params)?.id

    const userOrgs = await getUserOrganizations()

    if (!userOrgs?.some((org) => org?.id === id)) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: FetchErrorCode.AUTH,
            message: 'User not a member of this organization.',
          },
        } satisfies FetchResponse<Organization>,
        { status: 403 },
      )
    }

    const payload = (await req.json()) as Organization
    const { name } = payload

    // Bad data from client
    if (!name)
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

    const res = await db.organization.update({
      where: { id },
      data: { ...payload, updatedBy: user?.id },
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
    const id = (await params)?.id

    // Bad data from client
    if (!id)
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

    const res = await db.organization.delete({
      where: { id },
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
