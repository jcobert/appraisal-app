import { OrgMember, Organization } from '@prisma/client'

import { CORE_API_ENDPOINTS } from '@/lib/db/config'
import { ActiveUserOrgMember } from '@/lib/db/queries/organization'

import { filteredQueryKey } from '@/utils/query'

import useCoreQuery, { UseCoreQueryProps } from '@/hooks/use-core-query'

export const orgMemberQueryKey = {
  all: ['organizations', 'members'],
  filtered: (params: {
    organizationId: OrgMember['organizationId']
    memberId?: OrgMember['id']
    activeUser?: boolean
  }) => filteredQueryKey(params, orgMemberQueryKey.all),
} as const

type Props = {
  organizationId: Organization['id']
  memberId?: OrgMember['id']
  options?: Partial<UseCoreQueryProps<ActiveUserOrgMember>>
}

export const useGetOrgMember = ({
  organizationId,
  memberId,
  options,
}: Props) => {
  const endpoint = `${CORE_API_ENDPOINTS.organization}/${organizationId}/members`
  const url = memberId ? `${endpoint}/${memberId}` : `${endpoint}/active`
  return useCoreQuery({
    url,
    queryKey: orgMemberQueryKey.filtered({
      organizationId,
      memberId,
      activeUser: !memberId ? true : undefined,
    }),
    ...options,
    enabled: options?.enabled && !!organizationId,
  })
}
