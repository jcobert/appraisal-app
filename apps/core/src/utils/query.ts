import { FetchError, FetchResponse, isStatusCodeSuccess } from './fetch'
import { QueryClient, QueryClientConfig, QueryKey } from '@tanstack/react-query'

export const createQueryClient = (config?: QueryClientConfig) => {
  const { defaultOptions, ...conf } = config || {}
  const { queries, ...options } = defaultOptions || {}
  return new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        staleTime: 5 * 60 * 1000,
        enabled: false,
        ...queries,
      },
      ...options,
    },
    ...conf,
  })
}

export const filteredQueryKey = (
  params: Record<string, unknown>,
  baseKey: QueryKey,
) => {
  let queryKey = [...baseKey] as QueryKey
  const filteredParams = {} as typeof params
  Object.keys(params)?.forEach((key) => {
    if (typeof params[key] !== 'undefined') {
      filteredParams[key] = params[key]
    }
  })
  if (Object.keys(filteredParams)?.length) {
    queryKey = queryKey?.concat(filteredParams)
  }
  return queryKey
}

/**
 * Wrapper for React Query prefetch queryFn that handles error throwing.
 * Converts non-successful FetchResponse results into thrown FetchError instances.
 *
 * Use this for server-side prefetching with database handlers that return FetchResponse objects.
 *
 * @example
 * queryClient.prefetchQuery({
 *   queryKey: organizationsQueryKey.filtered({ id: organizationId }),
 *   queryFn: prefetchQuery(() => handleGetOrganization(organizationId)),
 * })
 */
export const prefetchQuery = <TData>(
  handler: () => Promise<FetchResponse<TData>>,
) => {
  return async (): Promise<FetchResponse<TData>> => {
    const result = await handler()
    if (!isStatusCodeSuccess(result.status)) {
      throw new FetchError(result)
    }
    return result
  }
}
