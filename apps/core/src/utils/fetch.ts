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

/** Returns whether the provided `status` is a valid HTTP response status code. */
export const isValidHttpStatusCode = (status?: number): status is number => {
  return Number.isInteger(status) && status! >= 100 && status! <= 599
}

export const successful = (status?: number) => {
  if (!status) return false
  return status >= 200 && status < 300
}

/** Helper function to get cookies for server-side requests */
const getServerSideHeaders = async (): Promise<Record<string, string>> => {
  if (typeof window === 'undefined') {
    // Server-side: dynamically import and forward cookies
    try {
      const { cookies } = await import('next/headers')
      const cookieStore = await cookies()
      const cookieHeader = cookieStore.toString()
      return cookieHeader ? { Cookie: cookieHeader } : {}
    } catch {
      // If import fails or we're not in a server context that supports cookies, return empty headers
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
  method: `${FetchMethod}`
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
      // If JSON parsing fails, create a generic error response
      // eslint-disable-next-line no-console
      console.error('Failed to parse API response as JSON:', parseError)
      return {
        data: null,
        status: res.status || 500,
        error: {
          code: FetchErrorCode.INTERNAL_ERROR,
          message: 'Failed to parse server response.',
        },
      }
    }

    return {
      status: res.status,
      ...responseData,
    }
  } catch (error) {
    // Only catch actual network/fetch errors here
    // eslint-disable-next-line no-console
    console.error('Network or internal fetch error:', error)

    // Network connectivity issues - these should get status 0
    if (
      error instanceof TypeError ||
      error instanceof DOMException ||
      (error &&
        typeof error === 'object' &&
        'name' in error &&
        error.name === 'AbortError')
    ) {
      return {
        data: null,
        status: 0,
        error: {
          code: FetchErrorCode.NETWORK_ERROR,
          message:
            'Network connection failed. Please check your internet connection.',
        },
      }
    }

    // Programming errors or unexpected system issues - these should get status 500
    return {
      data: null,
      status: 500,
      error: {
        code: FetchErrorCode.INTERNAL_ERROR,
        message: 'An unexpected error occurred.',
      },
    }
  }
}

const GET = async <TData = Record<string, unknown>>({
  url,
  options,
}: {
  url: string
  options?: Omit<RequestInit, 'method'>
}): Promise<FetchResponse<TData>> => {
  return createFetchFunction<never, TData>({ url, method: 'GET', options })
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
    method: 'POST',
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
    method: 'PUT',
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
    method: 'PATCH',
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
    method: 'DELETE',
    options,
  })
}

const coreFetch = { GET, POST, PUT, PATCH, DELETE }

export { coreFetch }
