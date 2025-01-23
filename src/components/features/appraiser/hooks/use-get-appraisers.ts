import { Appraiser } from '@prisma/client'

import { CORE_API_ENDPOINTS } from '@/lib/db/config'

import { filteredQueryKey } from '@/utils/query'

import useCoreQuery, { UseCoreQueryProps } from '@/hooks/use-core-query'

export const appraisersQueryKey = {
  all: ['appraisers'],
  filtered: (params: Partial<Appraiser>) =>
    filteredQueryKey(params, appraisersQueryKey.all),
} as const

type ResponseData<T extends Appraiser['id'] | undefined> = T extends string
  ? Appraiser
  : Appraiser[]

type Props<T extends Appraiser['id'] | undefined = undefined> = {
  id?: T
  options?: Partial<UseCoreQueryProps<ResponseData<T>>>
}

export const useGetAppraisers = <
  T extends Appraiser['id'] | undefined = undefined,
>({ id, options }: Props<T> = {}) => {
  const endpoint = CORE_API_ENDPOINTS.appraiser
  const url = id ? `${endpoint}/${id}` : endpoint
  return useCoreQuery<ResponseData<T>>({
    url,
    queryKey: appraisersQueryKey.filtered({ id }),
    ...options,
  })
}
