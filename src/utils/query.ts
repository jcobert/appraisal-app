import { QueryClient, QueryKey } from '@tanstack/react-query'

export const createQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        staleTime: 5 * 60 * 1000,
        enabled: false,
      },
    },
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
