import { QueryFunction, UseQueryOptions, useQuery } from '@tanstack/react-query'

import fetch, { FetchResponse } from '@/utils/fetch'

export type UseCoreQueryProps<TData = unknown> = UseQueryOptions<
  FetchResponse<TData>
> & {
  url: string
}

export const useCoreQuery = <TData = unknown>({
  url,
  ...options
}: UseCoreQueryProps<TData>) => {
  const queryFn: QueryFunction<FetchResponse<TData>> = async () => {
    return await fetch.GET({ url })
  }

  const { data: response, ...query } = useQuery<FetchResponse<TData>>({
    queryFn,
    ...options,
  })

  return { response, ...query }
}

export default useCoreQuery
