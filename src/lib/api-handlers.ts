// sort-imports-ignore
import 'server-only'

import { NextResponse } from 'next/server'

import { isAuthenticated } from '@/utils/auth'
import { FetchErrorCode, FetchResponse } from '@/utils/fetch'
import { ZodFieldErrors } from '@/utils/zod'

/**
 * Custom error class for validation errors with typed details.
 */
export class ValidationError extends Error {
  public readonly details: ZodFieldErrors

  constructor(message: string, details: ZodFieldErrors) {
    super(message)
    this.name = 'ValidationError'
    this.details = details
  }
}

/**
 * Custom error class for authorization errors.
 */
export class AuthorizationError extends Error {
  constructor(message: string = 'Unauthorized to perform this action.') {
    super(message)
    this.name = 'AuthorizationError'
  }
}

/**
 * Custom error class for not found errors.
 */
export class NotFoundError extends Error {
  constructor(message: string = 'The requested resource could not be found.') {
    super(message)
    this.name = 'NotFoundError'
  }
}

/**
 * Utility to add user ID fields to payload.
 * For use in handlers where auth is already confirmed.
 */
export const withUserFields = <T extends Record<string, any>>(
  payload: T,
  userId: string,
  fields: ('createdBy' | 'updatedBy')[] = ['updatedBy'],
): T & { createdBy?: string; updatedBy?: string } => {
  const userFields: { createdBy?: string; updatedBy?: string } = {}

  if (fields.includes('createdBy')) {
    userFields.createdBy = userId
  }
  if (fields.includes('updatedBy')) {
    userFields.updatedBy = userId
  }

  return {
    ...payload,
    ...userFields,
  }
}

/**
 * Convert a `FetchResponse` to a `NextResponse` for API routes.
 */
export const toNextResponse = <TData = any>(
  result: FetchResponse<TData>,
): NextResponse => {
  const status = result?.status || (result?.error ? 500 : 200)
  return NextResponse.json(result, { status })
}

/**
 * Configuration for API handlers.
 */
export type ApiHandlerConfig = {
  /** Whether authentication is required (default: true) */
  requireAuth?: boolean
  /** Additional authorization check function to run after authentication */
  authorizationCheck?: () => Promise<boolean>
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
}

/**
 * Creates a standardized API handler that can be used both in API routes and server components.
 * @param handler - The async function that contains the business logic
 * @param config - Configuration options for the handler
 * @returns ApiHandlerResult with both data and NextResponse
 */
export const createApiHandler = async <TData = any>(
  handler: ({
    user,
  }: {
    user: Awaited<ReturnType<typeof isAuthenticated>>['user']
  }) => Promise<TData>,
  config: ApiHandlerConfig = {},
): Promise<FetchResponse<TData>> => {
  const {
    requireAuth = true,
    authorizationCheck,
    messages = {},
    isMutation = false,
  } = config

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
  if (requireAuth) {
    if (!allowed) {
      return {
        status: 401,
        error: {
          code: FetchErrorCode.AUTH,
          message: authRequiredMessage,
        },
        data: null,
      }
    }
  }

  // Authorization check (if provided)
  if (authorizationCheck) {
    try {
      const authorized = await authorizationCheck()

      if (!authorized) {
        return {
          status: 403,
          data: null,
          error: {
            code: FetchErrorCode.AUTH,
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
          code: FetchErrorCode.FAILURE,
          message: authCheckFailedMessage,
        },
      }
    }
  }

  try {
    const data = await handler({ user })

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

    // Handle authorization errors
    if (error instanceof AuthorizationError) {
      return {
        status: 403,
        data: null,
        error: {
          code: FetchErrorCode.AUTH,
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

    /** @todo Handle prisma errors? */

    // Handle generic errors
    const errorMessage =
      error instanceof Error ? error?.message : generalFailureMessage

    return {
      status: 500,
      data: null,
      error: {
        code: FetchErrorCode.FAILURE,
        message: errorMessage,
      },
    }
  }
}
