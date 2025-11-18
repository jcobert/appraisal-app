import { useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'

import { OrgInvitation, OrgMember, Organization } from '@repo/database'
import { FormMode } from '@repo/types'

import { CORE_API_ENDPOINTS } from '@/lib/db/config'
import { type DeleteOrganizationResult } from '@/lib/db/handlers/organization-handlers'
import { type LeaveOrganizationResult } from '@/lib/db/handlers/organization-member-handlers'

import useCoreMutation, {
  UseCoreMutationProps,
} from '@/hooks/use-core-mutation'

import { organizationsQueryKey } from '@/configuration/react-query/query-keys'
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
  options,
}: UseOrganizationMutationsProps = {}) => {
  const queryClient = useQueryClient()

  const refreshData = useCallback(
    async ({ mode }: { mode?: FormMode } = { mode: 'create' }) => {
      if (mode === 'update') {
        await queryClient.refetchQueries({
          queryKey: organizationsQueryKey.filtered({ id: organizationId }),
          exact: true,
        })
      } else if (mode === 'delete') {
        queryClient.removeQueries({
          queryKey: organizationsQueryKey.filtered({ id: organizationId }),
          exact: true,
          type: 'all',
          stale: true,
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
    sanitize: { name: 'text' },
    toast: {
      messages: {
        success: ({ context: payload }) =>
          `Organization ${payload?.name} has been created!`,
      },
    },
    ...options,
    onSuccess: async () => {
      await refreshData({ mode: 'create' })
    },
  })

  const updateOrganization = useCoreMutation<Payload, Organization>({
    url: `${CORE_API_ENDPOINTS.organization}/${organizationId}`,
    method: 'PUT',
    sanitize: { name: 'text' },
    ...options,
    onSuccess: async () => {
      await refreshData({ mode: 'update' })
    },
  })

  const deleteOrganization = useCoreMutation<
    {},
    DeleteOrganizationResult['data']
  >({
    url: `${CORE_API_ENDPOINTS.organization}/${organizationId}`,
    method: 'DELETE',
    toast: {
      messages: {
        success: ({ response: { data } }) =>
          `${data?.name || 'Organization'} deleted successfully.`,
      },
    },
    ...(options as Omit<
      UseCoreMutationProps<Payload, DeleteOrganizationResult['data']>,
      'url' | 'method'
    >),
    onSuccess: async () => {
      await refreshData({ mode: 'delete' })
    },
  })

  const updateOrgMember = useCoreMutation<Partial<OrgMember>, OrgMember>({
    url: `${CORE_API_ENDPOINTS.organization}/${organizationId}/members/${memberId}`,
    method: 'PUT',
    ...(options as Omit<
      UseCoreMutationProps<Partial<OrgMember>, OrgMember>,
      'url' | 'method'
    >),
    onSuccess: async () => {
      await refreshData({ mode: 'update' })
    },
  })

  const removeOrgMember = useCoreMutation<
    { active: false },
    Pick<OrgMember, 'id'>
  >({
    url: `${CORE_API_ENDPOINTS.organization}/${organizationId}/members/${memberId}`,
    method: 'PUT',
    toast: {
      messages: {
        success: () => 'Member removed from organization successfully.',
      },
    },
    ...(options as Omit<
      UseCoreMutationProps<{ active: false }, Pick<OrgMember, 'id'>>,
      'url' | 'method'
    >),
    onSuccess: async () => {
      await refreshData({ mode: 'update' })
    },
  })

  const leaveOrganization = useCoreMutation<
    {},
    LeaveOrganizationResult['data']
  >({
    url: `${CORE_API_ENDPOINTS.organization}/${organizationId}/leave`,
    method: 'POST',
    toast: {
      messages: {
        success: ({ response: { data } }) =>
          `You have left ${data?.organization?.name || 'the organization'}.`,
      },
    },
    ...(options as Omit<
      UseCoreMutationProps<{}, LeaveOrganizationResult['data']>,
      'url' | 'method'
    >),
    onSuccess: async () => {
      await refreshData({ mode: 'update' })
    },
  })

  return {
    createOrganization,
    updateOrganization,
    deleteOrganization,
    updateOrgMember,
    removeOrgMember,
    leaveOrganization,
  }
}
