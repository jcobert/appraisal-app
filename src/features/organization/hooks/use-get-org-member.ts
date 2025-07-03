import { OrgMember, Organization } from '@prisma/client'

import { CORE_API_ENDPOINTS } from '@/lib/db/config'

import { filteredQueryKey } from '@/utils/query'

import useCoreQuery, { UseCoreQueryProps } from '@/hooks/use-core-query'

import { DetailedOrgMember } from '@/features/organization/types'

export const orgMemberQueryKey = {
  all: ['organizations'],
  filtered: (params: Partial<DetailedOrgMember>) =>
    filteredQueryKey(params, orgMemberQueryKey.all),
} as const

type ResponseData<T extends OrgMember['id'] | undefined> = T extends string
  ? DetailedOrgMember
  : OrgMember[]

type Props<T extends OrgMember['id'] | undefined = undefined> = {
  organizationId?: Organization['id']
  memberId?: T
  options?: Partial<UseCoreQueryProps<ResponseData<T>>>
}

export const useGetOrgMember = <
  T extends OrgMember['id'] | undefined = undefined,
>({ organizationId, memberId, options }: Props<T> = {}) => {
  const endpoint = `${CORE_API_ENDPOINTS.organization}/${organizationId}/members`
  const url = memberId ? `${endpoint}/${memberId}` : endpoint
  return useCoreQuery<ResponseData<T>>({
    url,
    queryKey: orgMemberQueryKey.filtered({ organizationId, id: memberId }),
    ...options,
  })
}
