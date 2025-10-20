import { User } from '@prisma/client'

import { CORE_API_ENDPOINTS } from '@/lib/db/config'

import { exists } from '@/utils/general'

import useCoreQuery, { UseCoreQueryProps } from '@/hooks/use-core-query'

import { usersQueryKey } from '@/configuration/react-query/query-keys'

// type ResponseData<T extends User['id'] | undefined> = T extends string
//   ? User
//   : User[]

type Props<T extends User['id'] | undefined = undefined> = {
  id?: T
  options?: Partial<UseCoreQueryProps<User>>
}

export const useGetUserProfile = <
  T extends User['id'] | undefined = undefined,
>({ id, options }: Props<T> = {}) => {
  const endpoint = CORE_API_ENDPOINTS.user
  const url = id ? `${endpoint}/${id}` : `${endpoint}/active`
  return useCoreQuery<User>({
    url,
    queryKey: !exists(id)
      ? usersQueryKey.active
      : usersQueryKey.filtered({ id }),
    ...options,
  })
}
