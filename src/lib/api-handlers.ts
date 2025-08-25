// sort-imports-ignore
import 'server-only'

import { NextResponse } from 'next/server'

import { isAuthenticated } from '@/utils/auth'
import { FetchErrorCode, FetchResponse } from '@/utils/fetch'

/**
 * Handler result type that maintains parity with FetchResponse
 * This ensures consistent data structure between:
 * - Server-side prefetching: handlers return FetchResponse<TData>
 * - Client-side API calls: fetch.GET() returns FetchResponse<TData>
 * - API routes: return toNextResponse(handlerResult)
 */
export type ApiHandlerResult<TData = any> = FetchResponse<TData>

/**
 * Convert a FetchResponse to a NextResponse for API routes
 */
export function toNextResponse<TData = any>(
  result: FetchResponse<TData>,
): NextResponse {
  const status = result?.status || (result?.error ? 500 : 200)
  return NextResponse.json(result, { status })
}

/**
 * Configuration for API handlers
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
 * Creates a standardized API handler that can be used both in API routes and server components
 * @param handler - The async function that contains the business logic
 * @param config - Configuration options for the handler
 * @returns ApiHandlerResult with both data and NextResponse
 */
export async function createApiHandler<TData = any>(
  handler: () => Promise<TData>,
  config: ApiHandlerConfig = {},
): Promise<ApiHandlerResult<TData>> {
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

  // Authentication check
  if (requireAuth) {
    const { allowed } = await isAuthenticated()

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
    const data = await handler()

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

    return {
      status: 500,
      data: null,
      error: {
        code: FetchErrorCode.FAILURE,
        message: generalFailureMessage,
      },
    }
  }
}

// Convenience functions for common patterns
export const createMutationHandler = <TData = any>(
  handler: () => Promise<TData>,
  config: Omit<ApiHandlerConfig, 'isMutation'> = {},
) => createApiHandler(handler, { ...config, isMutation: true })

export const createAuthorizedHandler = <TData = any>(
  handler: () => Promise<TData>,
  authorizationCheck: () => Promise<boolean>,
  config: Omit<ApiHandlerConfig, 'authorizationCheck'> = {},
) => createApiHandler(handler, { ...config, authorizationCheck })
