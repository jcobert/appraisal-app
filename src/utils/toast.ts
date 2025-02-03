import toast, {
  DefaultToastOptions,
  Renderable,
  ValueFunction,
  ValueOrFunction,
} from 'react-hot-toast'

import { FetchErrorCode, FetchResponse, successful } from '@/utils/fetch'

type ErrorToastMessages<T> = {
  [key in keyof typeof FetchErrorCode]?: ValueFunction<
    Renderable,
    FetchResponse<T>
  >
}

type ToastMessages<T> = {
  loading?: Renderable
  success?: ValueOrFunction<Renderable, FetchResponse<T>>
  error?: Partial<ErrorToastMessages<T>>
}

const genericErrorMessage = 'An unexpected error occurred. Please try again.'

const defaultToastMessages = {
  loading: 'Saving changes...',
  success: 'Your changes have been saved!',
  error: {
    INVALID_DATA: ({ error }) =>
      `There was a problem with your request.${error?.message ? `\nError: ${error?.message}` : ''}`,
    AUTH: () => 'You are not authorized to do that.',
    FAILURE: () => genericErrorMessage,
    DATABASE_FAILURE: () => genericErrorMessage,
    DUPLICATE: () => genericErrorMessage,
    NOT_FOUND: () => genericErrorMessage,
  },
} satisfies ToastMessages<unknown>

const promiseToast = <T>(
  request: () => Promise<FetchResponse<T>>,
  msgs?: ToastMessages<T>,
  opts?: DefaultToastOptions,
) => {
  const { error: errorMsgs, ...messages } = msgs || {}
  const response = toast.promise<FetchResponse<T>>(
    new Promise<FetchResponse<T>>(async (resolve, reject) => {
      const res = await request()
      if (!successful(res.status)) {
        reject(res)
      }
      resolve(res)
    }),
    {
      ...defaultToastMessages,
      ...messages,
      error: (response: FetchResponse<T>) => {
        const { error } = response || {}
        if (errorMsgs && error?.code && errorMsgs?.[error?.code]) {
          return (
            errorMsgs?.[error?.code]?.(response) ||
            defaultToastMessages.error?.[error?.code]?.(response) ||
            genericErrorMessage
          )
        }
        return error?.code
          ? defaultToastMessages.error?.[error?.code]?.(response) ||
              genericErrorMessage
          : genericErrorMessage
      },
    },
    opts,
  )
  return response
}

/** Runs provided async request with toasts. */
export const toastyRequest = async <T>(
  ...args: Parameters<typeof promiseToast<T>>
) => {
  try {
    const response = await promiseToast<T>(...args)
    return response
  } catch (error) {
    if (typeof error === 'object' && (error as FetchResponse<T>)?.status) {
      return error as Awaited<ReturnType<typeof promiseToast<T>>>
    }
    return {
      data: null,
      status: 500,
      error: { code: FetchErrorCode.FAILURE },
    } as FetchResponse<T>
  }
}
