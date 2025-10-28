import toast, {
  DefaultToastOptions,
  Renderable,
  ValueFunction,
} from 'react-hot-toast'

import {
  FetchErrorCode,
  FetchResponse,
  isStatusCodeSuccess,
} from '@/utils/fetch'

export type ErrorToastMessages<TRes = unknown, TCtx = unknown> = {
  [key in keyof typeof FetchErrorCode]?: ValueFunction<
    Renderable,
    { response: FetchResponse<TRes>; context?: TCtx }
  >
}

export type ToastMessages<TRes = unknown, TCtx = unknown> = {
  loading?: Renderable
  success?: ValueFunction<
    Renderable,
    { response: FetchResponse<TRes>; context?: TCtx }
  >
  error?: Partial<ErrorToastMessages<TRes, TCtx>>
}

const genericErrorMessage = 'An unexpected error occurred. Please try again.'

export const defaultToastMessages = {
  loading: 'Saving changes...',
  success: () => 'Your changes have been saved!',
  error: {
    INVALID_DATA: ({ response: { error } }) =>
      `There was a problem with your request.${error?.message ? `\nError: ${error?.message}` : ''}`,
    NOT_AUTHENTICATED: () => 'Please sign in to continue.',
    NOT_AUTHORIZED: () => 'You are not authorized to perform this action.',
    NETWORK_ERROR: () =>
      'Connection failed. Please check your internet connection and try again.',
    INTERNAL_ERROR: () => genericErrorMessage,
    DATABASE_FAILURE: () => genericErrorMessage,
    DUPLICATE: () => genericErrorMessage,
    NOT_FOUND: () => genericErrorMessage,
  },
} as const satisfies ToastMessages<unknown, unknown>

const promiseToast = <TRes = unknown, TCtx = unknown>(
  request: () => Promise<FetchResponse<TRes>>,
  msgs?: ToastMessages<TRes, TCtx>,
  opts?: DefaultToastOptions,
  context?: TCtx,
) => {
  const {
    error: errorMsgs,
    success: successMsg,
    loading: loadingMsg,
  } = msgs || {}
  const response = toast.promise<FetchResponse<TRes>>(
    new Promise<FetchResponse<TRes>>(async (resolve, reject) => {
      const res = await request()
      if (!isStatusCodeSuccess(res.status)) {
        reject(res)
      }
      resolve(res)
    }),
    {
      ...defaultToastMessages,
      loading: loadingMsg || defaultToastMessages.loading,
      success: (response: FetchResponse<TRes>) => {
        if (successMsg) return successMsg({ response, context })
        return defaultToastMessages.success()
      },
      error: (response: FetchResponse<TRes>) => {
        const { error } = response || {}
        if (errorMsgs && error?.code && errorMsgs?.[error?.code]) {
          return (
            errorMsgs?.[error?.code]?.({ response, context }) ||
            defaultToastMessages.error?.[error?.code]?.({
              response,
              context,
            }) ||
            genericErrorMessage
          )
        }
        return error?.code
          ? defaultToastMessages.error?.[error?.code]?.({
              response,
              context,
            }) || genericErrorMessage
          : genericErrorMessage
      },
    },
    opts,
  )
  return response
}

/** Runs provided async request with toasts. */
export const toastyRequest = async <TRes = unknown, TCtx = unknown>(
  ...args: Parameters<typeof promiseToast<TRes, TCtx>>
) => {
  try {
    const response = await promiseToast<TRes, TCtx>(...args)
    return response
  } catch (error) {
    if (typeof error === 'object' && (error as FetchResponse<TRes>)?.status) {
      return error as Awaited<ReturnType<typeof promiseToast<TRes, TCtx>>>
    }
    return {
      data: null,
      status: 500,
      error: {
        code: FetchErrorCode.INTERNAL_ERROR,
        message: 'An unexpected error occurred',
      },
    } as FetchResponse<TRes>
  }
}

/**
 * Toast utility for queries that shows error and optional success notifications.
 * Unlike toastyRequest/promiseToast, this doesn't show toast when loading.
 */
export const toastyQuery = async <TData = unknown>(
  queryFn: () => Promise<FetchResponse<TData>>,
  messages?: ToastMessages<TData, void>,
  options?: DefaultToastOptions,
): Promise<FetchResponse<TData>> => {
  try {
    const res = await queryFn()

    // If not successful, treat it as an error and show error toast
    if (!isStatusCodeSuccess(res?.status)) {
      let errorMessage: Renderable = genericErrorMessage

      // Check custom messages first
      if (
        res?.error?.code &&
        messages?.error?.[res.error.code as keyof typeof FetchErrorCode]
      ) {
        const customMessageGetter =
          messages.error[res.error.code as keyof typeof FetchErrorCode]
        if (customMessageGetter) {
          errorMessage = customMessageGetter({
            response: res,
            context: undefined,
          })
        }
      } else if (
        res?.error?.code &&
        defaultToastMessages.error[
          res.error.code as keyof typeof FetchErrorCode
        ]
      ) {
        const messageGetter =
          defaultToastMessages.error[
            res.error.code as keyof typeof FetchErrorCode
          ]
        if (messageGetter) {
          errorMessage = messageGetter({ response: res, context: undefined })
        }
      }

      toast.error(errorMessage, options)
      return res // Return the error response instead of throwing
    }

    // Request was successful - show success toast if configured
    if (messages?.success) {
      const successMessage = messages.success({
        response: res,
        context: undefined,
      })
      toast.success(successMessage, options)
    }

    return res
  } catch (error: any) {
    // Handle actual thrown errors (network errors, etc.)
    let errorMessage: Renderable = genericErrorMessage

    // Check custom messages first
    if (messages?.error?.[error?.code as keyof typeof FetchErrorCode]) {
      const customMessageGetter =
        messages.error[error.code as keyof typeof FetchErrorCode]
      if (customMessageGetter) {
        errorMessage = customMessageGetter({
          response: error,
          context: undefined,
        })
      }
    } else if (
      error?.code &&
      defaultToastMessages.error[error.code as keyof typeof FetchErrorCode]
    ) {
      const messageGetter =
        defaultToastMessages.error[error.code as keyof typeof FetchErrorCode]
      if (messageGetter) {
        errorMessage = messageGetter({ response: error, context: undefined })
      }
    }

    toast.error(errorMessage, options)
    throw error // Re-throw to maintain React Query's error handling
  }
}
