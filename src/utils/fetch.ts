export type FetchResponse<TData = any> = {
  status?: number
  data?: TData | null
  message?: string
  error?: { code?: string; message?: string }
}

export type FetchMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

export const isSuccess = (status?: number) => {
  if (!status) return false
  return status >= 200 && status < 300
}

const GET = async <TData = Record<string, unknown>>({
  url,
  options,
}: {
  url: string
  options?: Omit<RequestInit, 'method'>
}): Promise<FetchResponse<TData>> => {
  try {
    const res = await fetch(url, {
      method: 'GET',
      ...options,
    })
    const responseData = (await res.json()) as FetchResponse<TData>
    return {
      status: res.status,
      ...responseData,
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error)
    return {
      data: null,
      status: 500,
      error: {
        code: 'FAILURE',
        message: 'An unknown failure occurred.',
      },
    }
  }
}

const POST = async <
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
    const res = await fetch(url, {
      method: 'POST',
      body: JSON.stringify(payload),
      ...options,
    })
    const responseData = (await res.json()) as FetchResponse<TResData>
    return {
      status: res.status,
      ...responseData,
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error)
    return {
      data: null,
      status: 500,
      error: {
        code: 'FAILURE',
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
    const res = await fetch(url, {
      method: 'PUT',
      body: JSON.stringify(payload),
      ...options,
    })
    const responseData = (await res.json()) as FetchResponse<TResData>
    return {
      status: res.status,
      ...responseData,
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error)
    return {
      data: null,
      status: 500,
      error: {
        code: 'FAILURE',
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
    const res = await fetch(url, {
      method: 'PATCH',
      body: JSON.stringify(payload),
      ...options,
    })
    const responseData = (await res.json()) as FetchResponse<TResData>
    return {
      status: res.status,
      ...responseData,
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error)
    return {
      data: null,
      status: 500,
      error: {
        code: 'FAILURE',
        message: 'An unknown failure occurred.',
      },
    }
  }
}

const DELETE = async <
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
    const res = await fetch(url, {
      method: 'DELETE',
      body: JSON.stringify(payload),
      ...options,
    })
    const responseData = (await res.json()) as FetchResponse<TResData>
    return {
      status: res.status,
      ...responseData,
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error)
    return {
      data: null,
      status: 500,
      error: {
        code: 'FAILURE',
        message: 'An unknown failure occurred.',
      },
    }
  }
}

const requests = { GET, POST, PUT, PATCH, DELETE }

export default requests
