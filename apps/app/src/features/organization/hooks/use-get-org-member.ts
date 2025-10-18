import { OrgMember, Organization } from '@repo/database'

import { CORE_API_ENDPOINTS } from '@/lib/db/config'
import { ActiveUserOrgMember } from '@/lib/db/queries/organization'

import useCoreQuery, { UseCoreQueryProps } from '@/hooks/use-core-query'

import { orgMemberQueryKey } from '@/configuration/react-query/query-keys'

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
