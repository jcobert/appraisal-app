import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server'
import { User } from '@prisma/client'
import { NextRequest, NextResponse } from 'next/server'

import { db } from '@/lib/db/client'

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
    const id = (await params)?.id
    const res = await db.user.findUnique({ where: { id } })

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

// // =============
// //      PUT
// // =============
// export const PUT = async (
//   req: NextRequest,
//   { params }: { params: Promise<{ id: string }> },
// ) => {
//   const { getUser, isAuthenticated } = getKindeServerSession()

//   const user = await getUser()
//   const isLoggedIn = await isAuthenticated()

//   // No user
//   if (!isLoggedIn || !user) {
//     return NextResponse.json(
//       {
//         error: {
//           code: FetchErrorCode.AUTH,
//           message: 'User not authenticated.',
//         },
//         data: null,
//       } satisfies FetchResponse<User>,
//       { status: 401 },
//     )
//   }

//   // Not authorized
//   // if (!isAuthorized) {
//   //   return NextResponse.json(
//   //     {
//   //       error: { code: 'AUTH', message: 'User not authorized.' },
//   //       data: null,
//   //     } satisfies FetchResponse<User>,
//   //     { status: 403 },
//   //   )
//   // }

//   try {
//     const id = (await params)?.id
//     const payload = (await req.json()) as User
//     const { firstName, lastName } = payload

//     // Bad data from client
//     if (!firstName || !lastName)
//       return NextResponse.json(
//         {
//           data: null,
//           error: {
//             code: FetchErrorCode.INVALID_DATA,
//             message: 'Missing required fields.',
//           },
//         } satisfies FetchResponse<User>,
//         { status: 400 },
//       )

//     const res = await db.user.update({
//       where: { id },
//       data: { ...payload, updatedBy: user?.id },
//     })

//     /**
//      * @todo
//      * Identify alternate possibilities of res data structure for improved error handling/messaging.
//      * Does primsa return an error object?
//      * Would like to differentiate between db connection issue and bad payload.
//      */

//     // Server/database error
//     if (!res) {
//       return NextResponse.json(
//         {
//           data: null,
//           error: {
//             code: FetchErrorCode.DATABASE_FAILURE,
//             message: 'The request was not successful.',
//           },
//         } satisfies FetchResponse<User>,
//         { status: 500 },
//       )
//     }

//     // Success
//     return NextResponse.json(
//       {
//         data: null,
//         message: 'User updated successfully.',
//       } satisfies FetchResponse<User>,
//       { status: 200 },
//     )
//   } catch (error) {
//     // eslint-disable-next-line no-console
//     console.log('\n\nError updating user:\n', error)
//     return NextResponse.json(
//       {
//         data: null,
//         error: {
//           code: FetchErrorCode.FAILURE,
//           message: 'An unknown failure occurred.',
//         },
//       } satisfies FetchResponse<User>,
//       { status: 500 },
//     )
//   }
// }

// // ==============
// //     DELETE
// // ==============
// export const DELETE = async (
//   req: NextRequest,
//   { params }: { params: Promise<{ id: string }> },
// ) => {
//   const { getUser, isAuthenticated } = getKindeServerSession()

//   const user = await getUser()
//   const isLoggedIn = await isAuthenticated()

//   // No user
//   if (!isLoggedIn || !user) {
//     return NextResponse.json(
//       {
//         error: {
//           code: FetchErrorCode.AUTH,
//           message: 'User not authenticated.',
//         },
//         data: null,
//       } satisfies FetchResponse<User>,
//       { status: 401 },
//     )
//   }

//   // Not authorized
//   // if (!isAuthorized) {
//   //   return NextResponse.json(
//   //     {
//   //       error: { code: 'AUTH', message: 'User not authorized.' },
//   //       data: null,
//   //     } satisfies FetchResponse<User>,
//   //     { status: 403 },
//   //   )
//   // }

//   try {
//     const id = (await params)?.id

//     // Bad data from client
//     if (!id)
//       return NextResponse.json(
//         {
//           data: null,
//           error: {
//             code: FetchErrorCode.INVALID_DATA,
//             message: 'Missing required fields.',
//           },
//         } satisfies FetchResponse<User>,
//         { status: 400 },
//       )

//     const res = await db.user.delete({
//       where: { id },
//     })

//     /**
//      * @todo
//      * Identify alternate possibilities of res data structure for improved error handling/messaging.
//      * Does primsa return an error object?
//      * Would like to differentiate between db connection issue and bad payload.
//      */

//     // Server/database error
//     if (!res) {
//       return NextResponse.json(
//         {
//           data: null,
//           error: {
//             code: FetchErrorCode.DATABASE_FAILURE,
//             message: 'The request was not successful.',
//           },
//         } satisfies FetchResponse<User>,
//         { status: 500 },
//       )
//     }

//     // Success
//     return NextResponse.json(
//       {
//         data: res,
//         message: 'User deleted successfully.',
//       } satisfies FetchResponse<User>,
//       { status: 200 },
//     )
//   } catch (error) {
//     // eslint-disable-next-line no-console
//     console.log('\n\nError deleting user:\n', error)
//     return NextResponse.json(
//       {
//         data: null,
//         error: {
//           code: FetchErrorCode.FAILURE,
//           message: 'An unknown failure occurred.',
//         },
//       } satisfies FetchResponse<User>,
//       { status: 500 },
//     )
//   }
// }
