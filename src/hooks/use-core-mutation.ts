import {
  DefaultError,
  MutationFunction,
  UseMutationOptions,
  useMutation,
} from '@tanstack/react-query'
import { useCallback } from 'react'
import { DefaultToastOptions } from 'react-hot-toast'

import { FetchMethod, FetchResponse, coreFetch } from '@/utils/fetch'
import { ToastMessages, toastyRequest } from '@/utils/toast'

export type UseCoreMutationProps<
  TPayload extends Record<string, unknown> = Record<string, unknown>,
  TResData extends unknown = unknown,
> = UseMutationOptions<
  FetchResponse<TResData>,
  DefaultError,
  TPayload,
  unknown
> & {
  url: string
  method?: Exclude<`${FetchMethod}`, 'GET'>
  /** Transforms payload before request. */
  transform?: (payload: TPayload) => TPayload
  /** Configuration for toast notifications. */
  toast?: {
    /** Whether to display toast. @default true */
    enabled?: boolean
    /** Defines the toast messages. */
    messages?: ToastMessages<TResData, TPayload>
    /** Advanced toast options. */
    options?: DefaultToastOptions
  }
}

export const useCoreMutation = <
  TPayload extends Record<string, unknown> = Record<string, unknown>,
  TResData extends unknown = unknown,
>({
  url,
  method = 'POST',
  transform,
  toast: toastConfig = { enabled: true },
  ...options
}: UseCoreMutationProps<TPayload, TResData>) => {
  /** @todo Define toastConfig here to preserve partial defaults. */
  // const toastConfig = {
  //   enabled: true,
  //   ...toast,
  // } satisfies UseCoreMutationProps<TPayload, TResData>['toast']

  const mutationFetch = useCallback(
    async (data: TPayload): Promise<FetchResponse<TResData>> => {
      const payload = transform ? transform(data) : data

      switch (method) {
        case 'PUT':
          return coreFetch.PUT({ url, payload }) as FetchResponse<TResData>
        case 'PATCH':
          return coreFetch.PATCH({
            url,
            payload,
          }) as FetchResponse<TResData>
        case 'DELETE':
          return coreFetch.DELETE({ url }) as FetchResponse<TResData>
        case 'POST':
        default:
          return coreFetch.POST({ url, payload }) as FetchResponse<TResData>
      }
    },
    [url, method, transform],
  )

  const mutationFn: MutationFunction<
    FetchResponse<TResData>,
    TPayload
  > = async (data) => {
    // If toast is enabled use toastyRequest.
    if (toastConfig?.enabled) {
      return toastyRequest(
        () => mutationFetch(data),
        toastConfig?.messages,
        toastConfig?.options,
        data,
      )
    }
    // Otherwise just return the raw fetch response.
    return mutationFetch(data)
  }

  return useMutation<FetchResponse<TResData>, DefaultError, TPayload, unknown>({
    mutationFn,
    ...options,
  })
}

export default useCoreMutation
