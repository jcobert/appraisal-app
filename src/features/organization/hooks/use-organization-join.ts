import { OrgInvitation, Organization } from '@prisma/client'

import { CORE_API_ENDPOINTS } from '@/lib/db/config'

import { FetchResponse } from '@/utils/fetch'

import useCoreMutation, {
  UseCoreMutationProps,
} from '@/hooks/use-core-mutation'

type Payload = Pick<OrgInvitation, 'token' | 'status'>

export type UseOrganizationJoinProps = {
  organizationId: Organization['id'] | null | undefined
  options?: UseCoreMutationProps<Payload, FetchResponse>
}

export const useOrganizationJoin = ({
  organizationId,
  options,
}: UseOrganizationJoinProps) => {
  const mutation = useCoreMutation({
    url: `${CORE_API_ENDPOINTS.organization}/${organizationId}/join`,
    method: 'POST',
    ...options,
  })
  return mutation
}
