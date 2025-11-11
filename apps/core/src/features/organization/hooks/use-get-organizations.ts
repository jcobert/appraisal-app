import { Organization } from '@repo/database'

import { CORE_API_ENDPOINTS } from '@/lib/db/config'

import useCoreQuery, { UseCoreQueryProps } from '@/hooks/use-core-query'

import { organizationsQueryKey } from '@/configuration/react-query/query-keys'
import { DetailedOrganization } from '@/features/organization/types'

type ResponseData<T extends Organization['id'] | undefined> = T extends string
  ? DetailedOrganization
  : Organization[]

type Props<T extends Organization['id'] | undefined = undefined> = {
  id?: T
  options?: Partial<UseCoreQueryProps<ResponseData<T>>>
}

export const useGetOrganizations = <
  T extends Organization['id'] | undefined = undefined,
>({ id, options }: Props<T> = {}) => {
  const endpoint = CORE_API_ENDPOINTS.organization
  const url = id ? `${endpoint}/${id}` : endpoint
  return useCoreQuery<ResponseData<T>>({
    url,
    queryKey: organizationsQueryKey.filtered({ id }),
    // Organization data is critical - entire app depends on it
    // Throw DB errors to error boundary rather than graceful degradation
    throwOnDatabaseError: true,
    ...options,
  })
}
