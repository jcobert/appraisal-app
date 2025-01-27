import { User } from '@prisma/client'

import { CORE_API_ENDPOINTS } from '@/lib/db/config'

import { filteredQueryKey } from '@/utils/query'

import useCoreQuery, { UseCoreQueryProps } from '@/hooks/use-core-query'

export const usersQueryKey = {
  all: ['users'],
  filtered: (params: Partial<User>) =>
    filteredQueryKey(params, usersQueryKey.all),
} as const

type ResponseData<T extends User['id'] | undefined> = T extends string
  ? User
  : User[]

type Props<T extends User['id'] | undefined = undefined> = {
  id?: T
  options?: Partial<UseCoreQueryProps<ResponseData<T>>>
}

export const useGetUserProfile = <
  T extends User['id'] | undefined = undefined,
>({ id, options }: Props<T> = {}) => {
  const endpoint = CORE_API_ENDPOINTS.user
  const url = id ? `${endpoint}/${id}` : `${endpoint}/active`
  return useCoreQuery<ResponseData<T>>({
    url,
    queryKey: usersQueryKey.filtered({ id }),
    ...options,
  })
}
