import { QueryKey } from '@tanstack/react-query'

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
