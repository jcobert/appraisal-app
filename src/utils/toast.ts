import toast, {
  DefaultToastOptions,
  Renderable,
  ValueOrFunction,
} from 'react-hot-toast'

import { FetchErrorCode, FetchResponse, successful } from '@/utils/fetch'

export type RequestToastMsgs<T> = {
  loading?: Renderable
  success?: ValueOrFunction<Renderable, FetchResponse<T>>
  error?: ValueOrFunction<Renderable, FetchResponse<T>>
}

/** Runs provided async request with toasts. */
export const toastyRequest = <T>(
  request: () => Promise<FetchResponse<T>>,
  msgs?: RequestToastMsgs<T>,
  opts?: DefaultToastOptions,
) => {
  const response = toast.promise<FetchResponse<T>>(
    new Promise<FetchResponse<T>>(async (resolve, reject) => {
      const res = await request()
      // if (!successful(res.status)) {
      //   reject(res)
      // }
      resolve(res as FetchResponse<T>)
    }),
    {
      loading: 'Saving changes...',
      // success: 'Your changes have been saved!',
      success: ({ error, status }: FetchResponse<T>) => {
        if (successful(status)) return 'Your changes have been saved!'
        switch (error?.code) {
          case FetchErrorCode.INVALID_DATA:
            return `There was a problem with your request.\nError: ${error?.message}`
          case FetchErrorCode.AUTH:
            return 'You are not authorized to do that.'
          default:
            return 'An unexpected error occurred. Please try again.'
        }
      },
      error: ({ error }: FetchResponse<T>) => {
        switch (error?.code) {
          case FetchErrorCode.INVALID_DATA:
            return `There was a problem with your request.\nError: ${error?.message}`
          case FetchErrorCode.AUTH:
            return 'You are not authorized to do that.'
          default:
            return 'An unexpected error occurred. Please try again.'
        }
      },
      ...msgs,
    },
    opts,
  )
  return response
}
