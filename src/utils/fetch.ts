import { ZodFieldErrors } from '@/utils/zod'

export enum FetchErrorCode {
  AUTH = 'AUTH',
  NOT_FOUND = 'NOT_FOUND',
  INVALID_DATA = 'INVALID_DATA',
  DUPLICATE = 'DUPLICATE',
  DATABASE_FAILURE = 'DATABASE_FAILURE',
  FAILURE = 'FAILURE',
}

export type FetchMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

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

const GET = async <TData = Record<string, unknown>>({
  url,
  options,
}: {
  url: string
  options?: Omit<RequestInit, 'method'>
}): Promise<FetchResponse<TData>> => {
  try {
    const serverSideHeaders = await getServerSideHeaders()
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        ...serverSideHeaders,
        ...options?.headers,
      },
      ...options,
    })
    const responseData = (await res.json()) as FetchResponse<TData>
    return {
      status: res.status,
      ...responseData,
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.log(error)
    return {
      data: null,
      status: 500,
      error: {
        code: FetchErrorCode.FAILURE,
        message: 'An unknown failure occurred.',
      },
    }
  }
}

const POST = async <
  TPayload extends Record<string, unknown> = Record<string, unknown>,
  // TResData extends Record<string, unknown> = Record<string, unknown>,
  TResData extends unknown = unknown,
>({
  url,
  payload,
  options,
}: {
  url: string
  payload: TPayload
  options?: Omit<RequestInit, 'method' | 'body'>
}): Promise<FetchResponse<TResData>> => {
  try {
    const serverSideHeaders = await getServerSideHeaders()
    const res = await fetch(url, {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: {
        'Content-Type': 'application/json',
        ...serverSideHeaders,
        ...options?.headers,
      },
      ...options,
    })
    const responseData = (await res.json()) as FetchResponse<TResData>
    return {
      status: res.status,
      ...responseData,
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.log(error)
    return {
      data: null,
      status: 500,
      error: {
        code: FetchErrorCode.FAILURE,
        message: 'An unknown failure occurred.',
      },
    }
  }
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
  try {
    const serverSideHeaders = await getServerSideHeaders()
    const res = await fetch(url, {
      method: 'PUT',
      body: JSON.stringify(payload),
      headers: {
        'Content-Type': 'application/json',
        ...serverSideHeaders,
        ...options?.headers,
      },
      ...options,
    })
    const responseData = (await res.json()) as FetchResponse<TResData>
    return {
      status: res.status,
      ...responseData,
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.log(error)
    return {
      data: null,
      status: 500,
      error: {
        code: FetchErrorCode.FAILURE,
        message: 'An unknown failure occurred.',
      },
    }
  }
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
  try {
    const serverSideHeaders = await getServerSideHeaders()
    const res = await fetch(url, {
      method: 'PATCH',
      body: JSON.stringify(payload),
      headers: {
        'Content-Type': 'application/json',
        ...serverSideHeaders,
        ...options?.headers,
      },
      ...options,
    })
    const responseData = (await res.json()) as FetchResponse<TResData>
    return {
      status: res.status,
      ...responseData,
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.log(error)
    return {
      data: null,
      status: 500,
      error: {
        code: FetchErrorCode.FAILURE,
        message: 'An unknown failure occurred.',
      },
    }
  }
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
  try {
    const serverSideHeaders = await getServerSideHeaders()
    const res = await fetch(url, {
      method: 'DELETE',
      headers: {
        ...serverSideHeaders,
        ...options?.headers,
      },
      ...options,
    })
    const responseData = (await res.json()) as FetchResponse<TResData>
    return {
      status: res.status,
      ...responseData,
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.log(error)
    return {
      data: null,
      status: 500,
      error: {
        code: FetchErrorCode.FAILURE,
        message: 'An unknown failure occurred.',
      },
    }
  }
}

const coreFetch = { GET, POST, PUT, PATCH, DELETE }

export { coreFetch }
export default coreFetch
