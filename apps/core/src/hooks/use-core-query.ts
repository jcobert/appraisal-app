import { useProgress } from '@bprogress/next'
import {
  QueryFunction,
  QueryFunctionContext,
  UseQueryOptions,
  useQuery,
} from '@tanstack/react-query'
import { useCallback } from 'react'
import { DefaultToastOptions } from 'react-hot-toast'

import { FetchError, FetchResponse, fetchRequest } from '@/utils/fetch'
import { ToastMessages, toastyQuery } from '@/utils/toast'

export type UseCoreQueryProps<TData = unknown> = UseQueryOptions<
  FetchResponse<TData>,
  FetchError<TData>
> & {
  url: string
  /** Configuration for toast notifications. */
  toast?: {
    /** Whether to display toasts. @default false */
    enabled: boolean
    /** Defines the toast messages. */
    messages?: ToastMessages<TData, void>
    /** Advanced toast options. */
    options?: DefaultToastOptions
  }
  /** Whether to show progress bar during request. @default false */
  showProgress?: boolean
}

export const useCoreQuery = <TData = unknown>({
  url,
  toast,
  showProgress = false,
  ...options
}: UseCoreQueryProps<TData>) => {
  const toastConfig = {
    enabled: false,
    ...toast,
  } satisfies UseCoreQueryProps<TData>['toast']

  const { start, stop } = useProgress()

  const queryFetch = useCallback(
    async (context: QueryFunctionContext): Promise<FetchResponse<TData>> => {
      if (showProgress) {
        start()
      }

      try {
        const res = await fetchRequest.GET<TData>({
          url,
          options: { signal: context?.signal },
        })
        return res
      } finally {
        if (showProgress) {
          stop()
        }
      }
    },
    [url, start, stop, showProgress],
  )

  const queryFn: QueryFunction<FetchResponse<TData>> = async (context) => {
    // If toast is enabled use toastyQuery.
    if (toastConfig?.enabled) {
      return toastyQuery(
        () => queryFetch(context),
        toastConfig?.messages,
        toastConfig?.options,
      )
    }
    // Otherwise just return the raw fetch response.
    return queryFetch(context)
  }

  const { data: response, ...query } = useQuery<
    FetchResponse<TData>,
    FetchError<TData>
  >({
    queryFn,
    ...options,
  })

  return { response, ...query }
}

export default useCoreQuery
