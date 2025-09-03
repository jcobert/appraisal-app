import { QueryFunction, UseQueryOptions, useQuery } from '@tanstack/react-query'
import { useCallback } from 'react'
import { DefaultToastOptions } from 'react-hot-toast'

import fetch, { FetchResponse } from '@/utils/fetch'
import { ToastMessages, toastyQuery } from '@/utils/toast'

export type UseCoreQueryProps<TData = unknown> = UseQueryOptions<
  FetchResponse<TData>
> & {
  url: string
  /** Configuration for toast notifications. */
  toast?: {
    /** Whether to display error toasts. @default false */
    enabled?: boolean
    /** Defines the toast messages. */
    messages?: ToastMessages<TData, void>
    /** Advanced toast options. */
    options?: DefaultToastOptions
  }
}

export const useCoreQuery = <TData = unknown>({
  url,
  toast: toastConfig = { enabled: false },
  ...options
}: UseCoreQueryProps<TData>) => {
  const queryFetch = useCallback(async (): Promise<FetchResponse<TData>> => {
    return fetch.GET({ url }) as FetchResponse<TData>
  }, [url])

  const queryFn: QueryFunction<FetchResponse<TData>> = async () => {
    // If toast is enabled use toastyQuery for error-only handling.
    if (toastConfig?.enabled) {
      return toastyQuery(
        () => queryFetch(),
        toastConfig?.messages,
        toastConfig?.options,
      )
    }
    // Otherwise just return the raw fetch response.
    return queryFetch()
  }

  const { data: response, ...query } = useQuery<FetchResponse<TData>>({
    queryFn,
    ...options,
  })

  return { response, ...query }
}

export default useCoreQuery
