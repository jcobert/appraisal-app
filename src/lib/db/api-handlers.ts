// sort-imports-ignore
import 'server-only'

import {
  PrismaClientKnownRequestError,
  PrismaClientUnknownRequestError,
  PrismaClientValidationError,
} from '@prisma/client/runtime/library'
import { NextResponse } from 'next/server'

import {
  AuthenticationError,
  AuthorizationError,
  DatabaseConnectionError,
  DatabaseConstraintError,
  NotFoundError,
  parsePrismaError,
  ValidationError,
} from '@/lib/db/errors'

import { isAuthenticated } from '@/utils/auth'
import { db } from '@/lib/db/client'
import {
  FetchErrorCode,
  FetchResponse,
  isValidHttpStatusCode,
} from '@/utils/fetch'

/**
 * Utility to add user profile ID fields to payload for audit trails.
 * For use in handlers where auth is already confirmed.
 *
 * @param payload - The base data payload
 * @param userProfileId - The user's database profile ID (NOT auth account ID)
 * @param fields - Which audit fields to include
 */
export const withUserFields = <T extends Record<string, any>>(
  payload: T,
  userProfileId: string,
  fields: ('createdBy' | 'updatedBy')[] = ['updatedBy'],
): T & { createdBy?: string; updatedBy?: string } => {
  const userFields: { createdBy?: string; updatedBy?: string } = {}

  if (!userProfileId) {
    throw new AuthenticationError(
      'User profile ID is required for audit trail.',
    )
  }

  if (fields?.includes('createdBy')) {
    userFields.createdBy = userProfileId
  }
  if (fields?.includes('updatedBy')) {
    userFields.updatedBy = userProfileId
  }

  return {
    ...payload,
    ...userFields,
  }
}

/**
 * Get the user's database profile ID from their auth account ID.
 * Returns null if no profile exists.
 *
 * @param userAccountId - The auth account ID (e.g., from Kinde)
 */
export const getUserProfileId = async (
  userAccountId: string,
): Promise<string | null> => {
  const userProfile = await db.user.findUnique({
    where: { accountId: userAccountId },
    select: { id: true },
  })

  return userProfile?.id || null
}

/**
 * Convert a `FetchResponse` to a `NextResponse` for API routes.
 */
export const toNextResponse = <TData = any>(
  result: FetchResponse<TData>,
): NextResponse => {
  const status = isValidHttpStatusCode(result?.status)
    ? result?.status
    : result?.error
      ? 500
      : 200
  return NextResponse.json(result, { status })
}

type ContextUser = Awaited<ReturnType<typeof isAuthenticated>>['user']

/** Context provided to various API handler callback parameters. */
type ApiHandlerContext<TBypassAuth extends boolean = boolean> = {
  user: TBypassAuth extends false ? NonNullable<ContextUser> : ContextUser
  /** The user's database profile ID (resolved from auth account ID) */
  userProfileId: TBypassAuth extends false ? string : string | null
}

/**
 * Configuration for API handlers.
 */
export type ApiHandlerConfig<TBypassAuth extends boolean = boolean> = {
  /** Additional authorization check function to run after authentication */
  authorizationCheck?: (
    context: ApiHandlerContext<TBypassAuth>,
  ) => Promise<boolean>
  /** @todo Update messages to functions with data similar to toasts?. */
  /** Custom messages for different response scenarios */
  messages?: {
    /** Success message to include in successful responses */
    success?: string
    /** Message for unauthorized access (403) */
    unauthorized?: string
    /** Message for unauthenticated requests (401) */
    authRequired?: string
    /** Message when authorization check function fails */
    authCheckFailed?: string
    /** Message for not found resources (404) */
    notFound?: string
    /** Message for general/unknown failures (500) */
    generalFailure?: string
  }
  /** Whether this is a mutation operation - affects how null results are handled */
  isMutation?: boolean
  /**
   * By default, user authentication is checked before running handler.
   *
   * Setting this parameter to `true` will bypass that check and allow handler to run unauthenticated.
   *
   * ⚠️ Be very careful when using this option and be sure to handle authentication checks in your handler as needed.
   * There are very few cases where unauthenticated interaction with the DB should be allowed.
   * @default false
   */
  dangerouslyBypassAuthentication?: TBypassAuth
}

/**
 * Creates a standardized API handler that can be used both in API routes and server components.
 * @param handler - The async function that contains the business logic
 * @param config - Configuration options for the handler
 * @returns ApiHandlerResult with both data and NextResponse
 */
export const createApiHandler = async <
  TBypassAuth extends boolean = false,
  TData = any,
>(
  handler: (context: ApiHandlerContext<TBypassAuth>) => Promise<TData>,
  config?: ApiHandlerConfig<TBypassAuth>,
): Promise<FetchResponse<TData>> => {
  const {
    authorizationCheck,
    messages = {},
    isMutation = false,
    dangerouslyBypassAuthentication = false,
  } = config || {}

  // Default messages
  const {
    success: successMessage,
    unauthorized: unauthorizedMessage = 'Unauthorized to perform this action.',
    authRequired: authRequiredMessage = 'User not authenticated.',
    authCheckFailed: authCheckFailedMessage = 'Authorization check failed.',
    notFound: notFoundMessage = 'The requested resource could not be found.',
    generalFailure: generalFailureMessage = 'An unknown failure occurred.',
  } = messages

  const { allowed, user } = await isAuthenticated()

  // Authentication check
  if (!dangerouslyBypassAuthentication) {
    if (!allowed) {
      return {
        status: 401,
        error: {
          code: FetchErrorCode.NOT_AUTHENTICATED,
          message: authRequiredMessage,
        },
        data: null,
      }
    }
  }

  // Authorization check (if provided)
  if (authorizationCheck) {
    try {
      const authorized = await authorizationCheck({ user } as ApiHandlerContext)

      if (!authorized) {
        return {
          status: 403,
          data: null,
          error: {
            code: FetchErrorCode.NOT_AUTHORIZED,
            message: unauthorizedMessage,
          },
        }
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Authorization check error:', error)

      return {
        status: 500,
        data: null,
        error: {
          code: FetchErrorCode.INTERNAL_ERROR,
          message: authCheckFailedMessage,
        },
      }
    }
  }

  try {
    // Resolve user profile ID for authenticated users
    let userProfileId: string | null = null
    if (!dangerouslyBypassAuthentication && user?.id) {
      userProfileId = await getUserProfileId(user.id)
    }

    const data = await handler({ user, userProfileId } as ApiHandlerContext)

    // Handle null/undefined results
    if (!isMutation && (data === null || data === undefined)) {
      return {
        status: 404,
        data: null,
        error: {
          code: FetchErrorCode.NOT_FOUND,
          message: notFoundMessage,
        },
      }
    }

    // Success response
    return successMessage
      ? { status: 200, data, message: successMessage }
      : { status: 200, data }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('API Handler Error:', error)

    // Handle validation errors with typed details
    if (error instanceof ValidationError) {
      return {
        status: 400,
        data: null,
        error: {
          code: FetchErrorCode.INVALID_DATA,
          message: error?.message,
          details: error?.details,
        },
      }
    }

    // Handle authentication errors
    if (error instanceof AuthenticationError) {
      return {
        status: 401,
        data: null,
        error: {
          code: FetchErrorCode.NOT_AUTHENTICATED,
          message: error?.message,
        },
      }
    }

    // Handle authorization errors
    if (error instanceof AuthorizationError) {
      return {
        status: 403,
        data: null,
        error: {
          code: FetchErrorCode.NOT_AUTHORIZED,
          message: error?.message,
        },
      }
    }

    // Handle not found errors
    if (error instanceof NotFoundError) {
      return {
        status: 404,
        data: null,
        error: {
          code: FetchErrorCode.NOT_FOUND,
          message: error?.message,
        },
      }
    }

    // Handle database constraint errors
    if (error instanceof DatabaseConstraintError) {
      return {
        status: 409,
        data: null,
        error: {
          code: FetchErrorCode.DUPLICATE,
          message: error?.message,
        },
      }
    }

    // Handle database connection errors
    if (error instanceof DatabaseConnectionError) {
      return {
        status: 503,
        data: null,
        error: {
          code: FetchErrorCode.DATABASE_FAILURE,
          message: error?.message,
        },
      }
    }

    // Handle Prisma errors with detailed parsing
    if (
      error instanceof PrismaClientKnownRequestError ||
      error instanceof PrismaClientUnknownRequestError ||
      error instanceof PrismaClientValidationError ||
      (error &&
        typeof error === 'object' &&
        'code' in error &&
        (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND'))
    ) {
      const prismaError = parsePrismaError(error)
      return {
        status: prismaError.status,
        data: null,
        error: {
          code: prismaError.code,
          message: prismaError.message,
        },
      }
    }

    // Handle generic errors
    const errorMessage =
      error instanceof Error ? error?.message : generalFailureMessage

    return {
      status: 500,
      data: null,
      error: {
        code: FetchErrorCode.INTERNAL_ERROR,
        message: errorMessage,
      },
    }
  }
}
