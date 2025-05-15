import { OrgMember, Organization, User } from '@prisma/client'

import { CORE_API_ENDPOINTS } from '@/lib/db/config'

import { filteredQueryKey } from '@/utils/query'

import useCoreQuery, { UseCoreQueryProps } from '@/hooks/use-core-query'

export const organizationsQueryKey = {
  all: ['organizations'],
  filtered: (params: Partial<Organization>) =>
    filteredQueryKey(params, organizationsQueryKey.all),
} as const

export type OrganizationWithMembers = Organization & {
  members?: (OrgMember & { user?: User })[]
}

type ResponseData<T extends Organization['id'] | undefined> = T extends string
  ? OrganizationWithMembers
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
    ...options,
  })
}
