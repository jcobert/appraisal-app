import {
  QueryFunction,
  QueryFunctionContext,
  UseQueryOptions,
  useQuery,
} from '@tanstack/react-query'
import { useCallback } from 'react'
import { DefaultToastOptions } from 'react-hot-toast'

import { FetchResponse, coreFetch } from '@/utils/fetch'
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
  /** @todo Define toastConfig here to preserve partial defaults. */
  // const toastConfig = {
  //   enabled: false,
  //   ...toast,
  // } satisfies UseCoreQueryProps<TData>['toast']

  const queryFetch = useCallback(
    async (context: QueryFunctionContext): Promise<FetchResponse<TData>> => {
      return coreFetch.GET({
        url,
        options: { signal: context?.signal },
      }) as FetchResponse<TData>
    },
    [url],
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

  const { data: response, ...query } = useQuery<FetchResponse<TData>>({
    queryFn,
    ...options,
  })

  return { response, ...query }
}

export default useCoreQuery
