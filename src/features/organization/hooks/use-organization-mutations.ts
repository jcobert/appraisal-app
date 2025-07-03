import { OrgMember, Organization } from '@prisma/client'

import { CORE_API_ENDPOINTS } from '@/lib/db/config'

import useCoreMutation, {
  UseCoreMutationProps,
} from '@/hooks/use-core-mutation'

import { DetailedOrganization } from '@/features/organization/types'

type Payload = Partial<DetailedOrganization>

type UseOrganizationMutationsProps = {
  organization?: Organization | null
  memberId?: OrgMember['id']
  options?: Omit<
    UseCoreMutationProps<Payload | {}, Organization>,
    'url' | 'method'
  >
}

export const useOrganizationMutations = ({
  organization,
  memberId,
  options,
}: UseOrganizationMutationsProps = {}) => {
  const createOrganization = useCoreMutation<Payload, Organization>({
    url: CORE_API_ENDPOINTS.organization,
    method: 'POST',
    ...options,
  })

  const updateOrganization = useCoreMutation<Payload, Organization>({
    url: `${CORE_API_ENDPOINTS.organization}/${organization?.id}`,
    method: 'PUT',
    ...options,
  })

  const deleteOrganization = useCoreMutation<{}, Organization>({
    url: `${CORE_API_ENDPOINTS.organization}/${organization?.id}`,
    method: 'DELETE',
    ...options,
  })

  const deleteOrgMember = useCoreMutation<{}, OrgMember>({
    url: `${CORE_API_ENDPOINTS.organization}/${organization?.id}/members/${memberId}`,
    method: 'DELETE',
    ...(options as Omit<
      UseCoreMutationProps<Partial<OrgMember> | {}, OrgMember>,
      'url' | 'method'
    >),
  })

  const isPending =
    createOrganization.isPending ||
    updateOrganization.isPending ||
    deleteOrganization.isPending ||
    deleteOrgMember.isPending

  const isSuccess =
    createOrganization.isSuccess ||
    updateOrganization.isSuccess ||
    deleteOrganization.isSuccess ||
    deleteOrgMember.isSuccess

  const isError =
    createOrganization.isError ||
    updateOrganization.isError ||
    deleteOrganization.isError ||
    deleteOrgMember.isError

  return {
    createOrganization,
    updateOrganization,
    deleteOrganization,
    deleteOrgMember,
    isPending,
    isSuccess,
    isError,
  }
}
