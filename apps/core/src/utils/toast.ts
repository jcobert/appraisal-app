import toast, {
  DefaultToastOptions,
  Renderable,
  ValueFunction,
} from 'react-hot-toast'

import {
  FetchError,
  FetchErrorCode,
  FetchResponse,
  isFetchError,
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
    request(),
    {
      ...defaultToastMessages,
      loading: loadingMsg || defaultToastMessages.loading,
      success: (response: FetchResponse<TRes>) => {
        if (successMsg) return successMsg({ response, context })
        return defaultToastMessages.success()
      },
      error: (error: FetchError<TRes>) => {
        // Extract response from FetchError
        const response = isFetchError(error) ? error.response : null
        const errorDetails = response?.error

        if (errorMsgs && errorDetails?.code && errorMsgs[errorDetails.code]) {
          return (
            errorMsgs[errorDetails.code]?.({
              response: response || { data: null },
              context,
            }) ||
            defaultToastMessages.error?.[errorDetails.code]?.({
              response: response || { data: null },
              context,
            }) ||
            genericErrorMessage
          )
        }
        return errorDetails?.code
          ? defaultToastMessages.error?.[errorDetails.code]?.({
              response: response || { data: null },
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
    // Re-throw to maintain React Query's error handling
    throw error
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

    // Request was successful - show success toast if configured
    if (messages?.success) {
      const successMessage = messages.success({
        response: res,
        context: undefined,
      })
      toast.success(successMessage, options)
    }

    return res
  } catch (error: unknown) {
    // Handle FetchError instances
    let errorMessage: Renderable = genericErrorMessage

    if (isFetchError(error)) {
      const errorCode = error.code

      // Check custom messages first
      if (messages?.error?.[errorCode]) {
        const customMessageGetter = messages.error[errorCode]
        if (customMessageGetter) {
          errorMessage = customMessageGetter({
            response: error.response,
            context: undefined,
          })
        }
      } else if (defaultToastMessages.error[errorCode]) {
        const messageGetter = defaultToastMessages.error[errorCode]
        if (messageGetter) {
          errorMessage = messageGetter({
            response: error.response,
            context: undefined,
          })
        }
      }
    }

    toast.error(errorMessage, options)

    // Re-throw to maintain React Query's error handling
    throw error
  }
}
