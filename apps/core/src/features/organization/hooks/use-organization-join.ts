import { OrgInvitation, Organization } from '@repo/database'

import { CORE_API_ENDPOINTS } from '@/lib/db/config'
import { JoinOrganizationResult } from '@/lib/db/handlers/organization-join-handlers'

import useCoreMutation, {
  UseCoreMutationProps,
} from '@/hooks/use-core-mutation'

type Payload = Pick<OrgInvitation, 'token' | 'status'>

export type UseOrganizationJoinProps = {
  organizationId: Organization['id'] | null | undefined
  options?: UseCoreMutationProps<Payload, JoinOrganizationResult['data']>
}

export const useOrganizationJoin = ({
  organizationId,
  options,
}: UseOrganizationJoinProps) => {
  const mutation = useCoreMutation({
    url: `${CORE_API_ENDPOINTS.organization}/${organizationId}/join`,
    method: 'POST',
    toast: { enabled: false },
    ...options,
  })
  return mutation
}
