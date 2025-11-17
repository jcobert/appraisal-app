import { exists } from '@repo/utils'

import { ZodFieldErrors } from '@/utils/zod'

export enum FetchErrorCode {
  NOT_AUTHENTICATED = 'NOT_AUTHENTICATED',
  NOT_AUTHORIZED = 'NOT_AUTHORIZED',
  NOT_FOUND = 'NOT_FOUND',
  INVALID_DATA = 'INVALID_DATA',
  DUPLICATE = 'DUPLICATE',
  DATABASE_FAILURE = 'DATABASE_FAILURE',
  NETWORK_ERROR = 'NETWORK_ERROR',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
}

export enum FetchMethod {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  PATCH = 'PATCH',
  DELETE = 'DELETE',
}

export type FetchResponse<TData = any> = {
  status?: number
  data?: TData | null
  message?: string
  error?: {
    code?: FetchErrorCode
    message?: string
    details?: ZodFieldErrors | null
  }
}

/**
 * Custom error class for fetch/API request failures.
 * Wraps FetchResponse structure for consistent error handling across the application.
 */
export class FetchError<TData = any> extends Error {
  public readonly response: FetchResponse<TData>
  public readonly status: number
  public readonly code: FetchErrorCode
  public readonly details?: ZodFieldErrors | null

  constructor(response: FetchResponse<TData>) {
    const message =
      response.error?.message || response.message || 'Request failed'
    super(message)

    this.name = 'FetchError'
    this.response = response
    this.status = response.status ?? 500
    this.code = response.error?.code ?? FetchErrorCode.INTERNAL_ERROR
    this.details = response.error?.details

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, FetchError)
    }
  }
}

/** Type guard to check if an error is a `FetchError` instance. */
export const isFetchError = (error: unknown): error is FetchError => {
  return error instanceof FetchError
}

/** Returns whether the provided `status` is a valid HTTP response status code. */
export const isValidHttpStatusCode = (status?: number): status is number => {
  return Number.isInteger(status) && status! >= 100 && status! <= 599
}

/**
 * Returns whether the provided `status` code represents success -
 * in the range: `200 - 300`
 */
export const isStatusCodeSuccess = (status?: number): status is number => {
  if (!isValidHttpStatusCode(status)) return false
  return status >= 200 && status < 300
}

/** Helper function to get cookies for server-side requests. */
const getServerSideHeaders = async (): Promise<Record<string, string>> => {
  if (typeof window === 'undefined') {
    // Server-side: dynamically import and forward cookies.
    try {
      const { cookies } = await import('next/headers')
      const cookieStore = await cookies()
      const cookieHeader = cookieStore.toString()
      return cookieHeader ? { Cookie: cookieHeader } : {}
    } catch {
      // If import fails or we're not in a server context that supports cookies, return empty headers.
      return {}
    }
  }
  return {}
}

export const getAbsoluteUrl = (path?: string) => {
  const base = process.env.NEXT_PUBLIC_SITE_BASE_URL || ''
  return `${base}${path}`
}

/** Generic fetch function with error handling and server-side cookie support. */
const createFetchFunction = async <
  TPayload extends Record<string, unknown> = Record<string, unknown>,
  TResData = unknown,
>({
  url,
  method,
  payload,
  options,
}: {
  url: string
  method: FetchMethod
  payload?: TPayload
  options?: Omit<RequestInit, 'method' | 'body'>
}): Promise<FetchResponse<TResData>> => {
  try {
    const serverSideHeaders = await getServerSideHeaders()
    const hasBody =
      exists(payload) &&
      [FetchMethod.PATCH, FetchMethod.POST, FetchMethod.PUT].includes(method)

    const fetchConfig: RequestInit = {
      method,
      headers: {
        ...(hasBody && { 'Content-Type': 'application/json' }),
        ...serverSideHeaders,
        ...options?.headers,
      },
      ...(hasBody && { body: JSON.stringify(payload) }),
      ...options,
    }

    const res = await fetch(url, fetchConfig)

    // Try to parse response as JSON
    let responseData: FetchResponse<TResData>
    try {
      responseData = (await res.json()) as FetchResponse<TResData>
    } catch (parseError) {
      // If JSON parsing fails, it's always a 500 error regardless of HTTP status
      // (either server sent invalid JSON or our parsing logic failed)
      // eslint-disable-next-line no-console
      console.error('Failed to parse API response as JSON:', parseError)
      throw new FetchError<TResData>({
        data: null,
        status: 500,
        error: {
          code: FetchErrorCode.INTERNAL_ERROR,
          message: 'Failed to parse server response.',
        },
      })
    }

    // For non-OK responses, throw the error to trigger React Query's error handling
    if (!res?.ok) {
      throw new FetchError<TResData>({
        status: res.status,
        ...responseData,
      })
    }

    return {
      status: res.status,
      ...responseData,
    }
  } catch (error) {
    // If it's already a FetchError, re-throw it.
    if (isFetchError(error)) {
      throw error
    }

    // Handle network connectivity issues (TypeError, AbortError, etc.)
    if (
      error instanceof TypeError ||
      error instanceof DOMException ||
      (error &&
        typeof error === 'object' &&
        'name' in error &&
        error.name === 'AbortError')
    ) {
      throw new FetchError<TResData>({
        data: null,
        status: 0,
        error: {
          code: FetchErrorCode.NETWORK_ERROR,
          message:
            'Network connection failed. Please check your internet connection.',
        },
      })
    }

    // Programming errors or unexpected system issues
    // eslint-disable-next-line no-console
    console.error('Unexpected fetch error:', error)
    throw new FetchError<TResData>({
      data: null,
      status: 500,
      error: {
        code: FetchErrorCode.INTERNAL_ERROR,
        message: 'An unexpected error occurred.',
      },
    })
  }
}

const GET = async <TData = Record<string, unknown>>({
  url,
  options,
}: {
  url: string
  options?: Omit<RequestInit, 'method'>
}): Promise<FetchResponse<TData>> => {
  return createFetchFunction<never, TData>({
    url,
    method: FetchMethod.GET,
    options,
  })
}

const POST = async <
  TPayload extends Record<string, unknown> = Record<string, unknown>,
  TResData = unknown,
>({
  url,
  payload,
  options,
}: {
  url: string
  payload: TPayload
  options?: Omit<RequestInit, 'method' | 'body'>
}): Promise<FetchResponse<TResData>> => {
  return createFetchFunction<TPayload, TResData>({
    url,
    method: FetchMethod.POST,
    payload,
    options,
  })
}

const PUT = async <
  TPayload extends Record<string, unknown> = Record<string, unknown>,
  TResData extends Record<string, unknown> = Record<string, unknown>,
>({
  url,
  payload,
  options,
}: {
  url: string
  payload: TPayload
  options?: Omit<RequestInit, 'method' | 'body'>
}): Promise<FetchResponse<TResData>> => {
  return createFetchFunction<TPayload, TResData>({
    url,
    method: FetchMethod.PUT,
    payload,
    options,
  })
}

const PATCH = async <
  TPayload extends Record<string, unknown> = Record<string, unknown>,
  TResData extends Record<string, unknown> = Record<string, unknown>,
>({
  url,
  payload,
  options,
}: {
  url: string
  payload: TPayload
  options?: Omit<RequestInit, 'method' | 'body'>
}): Promise<FetchResponse<TResData>> => {
  return createFetchFunction<TPayload, TResData>({
    url,
    method: FetchMethod.PATCH,
    payload,
    options,
  })
}

const DELETE = async <
  TResData extends Record<string, unknown> = Record<string, unknown>,
>({
  url,
  options,
}: {
  url: string
  options?: Omit<RequestInit, 'method' | 'body'>
}): Promise<FetchResponse<TResData>> => {
  return createFetchFunction<never, TResData>({
    url,
    method: FetchMethod.DELETE,
    options,
  })
}

const fetchRequest = { GET, POST, PUT, PATCH, DELETE }

export { fetchRequest }
