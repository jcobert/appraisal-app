import { Organization } from '@prisma/client'

import { CORE_API_ENDPOINTS } from '@/lib/db/config'

import useCoreMutation, {
  UseCoreMutationProps,
} from '@/hooks/use-core-mutation'

type Payload = Partial<Organization>

type UseOrganizationMutationsProps = {
  initialData?: Organization | null
  options?: UseCoreMutationProps<Payload | {}, Organization>
}

export const useOrganizationMutations = ({
  initialData,
  options,
}: UseOrganizationMutationsProps = {}) => {
  const createOrganization = useCoreMutation<Payload, Organization>({
    url: CORE_API_ENDPOINTS.organization,
    method: 'POST',
    ...options,
  })

  const updateOrganization = useCoreMutation<Payload, Organization>({
    url: `${CORE_API_ENDPOINTS.organization}/${initialData?.id}`,
    method: 'PUT',
    ...options,
  })

  const deleteOrganization = useCoreMutation<{}, Organization>({
    url: `${CORE_API_ENDPOINTS.organization}/${initialData?.id}`,
    method: 'DELETE',
    ...options,
  })

  const isPending =
    createOrganization.isPending ||
    updateOrganization.isPending ||
    deleteOrganization.isPending

  const isSuccess =
    createOrganization.isSuccess ||
    updateOrganization.isSuccess ||
    deleteOrganization.isSuccess

  const isError =
    createOrganization.isError ||
    updateOrganization.isError ||
    deleteOrganization.isError

  return {
    createOrganization,
    updateOrganization,
    deleteOrganization,
    isPending,
    isSuccess,
    isError,
  }
}
