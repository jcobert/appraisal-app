import { OrgInvitation, OrgMember, Organization } from '@prisma/client'
import { useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'

import { CORE_API_ENDPOINTS } from '@/lib/db/config'

import { successful } from '@/utils/fetch'

import useCoreMutation, {
  UseCoreMutationProps,
} from '@/hooks/use-core-mutation'

import { organizationsQueryKey } from '@/features/organization/hooks/use-get-organizations'
import { DetailedOrganization } from '@/features/organization/types'

type Payload = Partial<DetailedOrganization>

type UseOrganizationMutationsProps = {
  organizationId?: Organization['id']
  memberId?: OrgMember['id']
  inviteId?: OrgInvitation['id']
  options?: Omit<UseCoreMutationProps<Payload, Organization>, 'url' | 'method'>
}

export const useOrganizationMutations = ({
  organizationId,
  memberId,
  inviteId,
  options,
}: UseOrganizationMutationsProps = {}) => {
  const queryClient = useQueryClient()

  const refreshData = useCallback(
    async ({ update }: { update?: boolean } = { update: false }) => {
      if (update) {
        await queryClient.refetchQueries({
          queryKey: organizationsQueryKey.filtered({ id: organizationId }),
          exact: true,
        })
      }
      queryClient.invalidateQueries({
        queryKey: organizationsQueryKey.all,
        exact: true,
      })
    },
    [organizationId, queryClient],
  )

  const createOrganization = useCoreMutation<Payload, Organization>({
    url: CORE_API_ENDPOINTS.organization,
    method: 'POST',
    ...options,
    onSuccess: async ({ status }) => {
      if (successful(status)) {
        await refreshData()
      }
    },
  })

  const updateOrganization = useCoreMutation<Payload, Organization>({
    url: `${CORE_API_ENDPOINTS.organization}/${organizationId}`,
    method: 'PUT',
    ...options,
    onSuccess: async ({ status }) => {
      if (successful(status)) {
        await refreshData({ update: true })
      }
    },
  })

  const deleteOrganization = useCoreMutation<{}, Organization>({
    url: `${CORE_API_ENDPOINTS.organization}/${organizationId}`,
    method: 'DELETE',
    ...options,
    onSuccess: async ({ status }) => {
      if (successful(status)) {
        await refreshData()
      }
    },
  })

  const updateOrgMember = useCoreMutation<{}, OrgMember>({
    url: `${CORE_API_ENDPOINTS.organization}/${organizationId}/members/${memberId}`,
    method: 'PUT',
    ...(options as Omit<
      UseCoreMutationProps<Partial<OrgMember>, OrgMember>,
      'url' | 'method'
    >),
    onSuccess: async ({ status }) => {
      if (successful(status)) {
        await refreshData({ update: true })
      }
    },
  })

  const deleteOrgMember = useCoreMutation<{}, OrgMember>({
    url: `${CORE_API_ENDPOINTS.organization}/${organizationId}/members/${memberId}`,
    method: 'DELETE',
    ...(options as Omit<
      UseCoreMutationProps<Partial<OrgMember> | {}, OrgMember>,
      'url' | 'method'
    >),
    onSuccess: async ({ status }) => {
      if (successful(status)) {
        await refreshData({ update: true })
      }
    },
  })

  const deleteOrgInvitation = useCoreMutation<{}, OrgInvitation>({
    url: `${CORE_API_ENDPOINTS.organization}/${organizationId}/invite/${inviteId}`,
    method: 'DELETE',
    ...(options as Omit<
      UseCoreMutationProps<Partial<OrgInvitation> | {}, OrgInvitation>,
      'url' | 'method'
    >),
    onSuccess: async ({ status }) => {
      if (successful(status)) {
        await refreshData()
      }
    },
  })

  // const isPending =
  //   createOrganization.isPending ||
  //   updateOrganization.isPending ||
  //   deleteOrganization.isPending ||
  //   deleteOrgMember.isPending ||
  //   deleteOrgInvitation.isPending

  // const isSuccess =
  //   createOrganization.isSuccess ||
  //   updateOrganization.isSuccess ||
  //   deleteOrganization.isSuccess ||
  //   deleteOrgMember.isSuccess ||
  //   deleteOrgInvitation.isSuccess

  // const isError =
  //   createOrganization.isError ||
  //   updateOrganization.isError ||
  //   deleteOrganization.isError ||
  //   deleteOrgMember.isError ||
  //   deleteOrgInvitation.isError

  return {
    createOrganization,
    updateOrganization,
    deleteOrganization,
    updateOrgMember,
    deleteOrgMember,
    deleteOrgInvitation,
  }
}
