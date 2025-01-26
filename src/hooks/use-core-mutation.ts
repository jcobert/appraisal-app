import {
  DefaultError,
  MutationFunction,
  UseMutationOptions,
  useMutation,
} from '@tanstack/react-query'

import fetch, { FetchMethod, FetchResponse } from '@/utils/fetch'

export type UseCoreMutationProps<
  TPayload extends Record<string, unknown> = Record<string, unknown>,
  TResData extends Record<string, unknown> = Record<string, unknown>,
> = UseMutationOptions<
  FetchResponse<TResData>,
  DefaultError,
  TPayload,
  unknown
> & {
  url: string
  method?: Exclude<FetchMethod, 'GET'>
  transform?: (payload: TPayload) => TPayload
}

export const useCoreMutation = <
  TPayload extends Record<string, unknown> = Record<string, unknown>,
  TResData extends Record<string, unknown> = Record<string, unknown>,
>({
  url,
  method = 'POST',
  transform,
  ...options
}: UseCoreMutationProps<TPayload, TResData>) => {
  const mutationFn: MutationFunction<
    FetchResponse<TResData>,
    TPayload
  > = async (data) => {
    const payload = transform ? transform(data) : data
    switch (method) {
      case 'PUT':
        return await fetch.PUT({ url, payload })
      case 'PATCH':
        return await fetch.PATCH({ url, payload })
      case 'DELETE':
        return await fetch.DELETE({ url })
      case 'POST':
      default:
        return await fetch.POST({ url, payload })
    }
  }

  return useMutation<FetchResponse<TResData>, DefaultError, TPayload, unknown>({
    mutationFn,
    ...options,
  })
}

export default useCoreMutation
