import { OrgInvitation, OrgMember, Organization, User } from '@prisma/client'
import { useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'
import { CreateEmailOptions, CreateEmailResponse } from 'resend'

import { CORE_API_ENDPOINTS } from '@/lib/db/config'

import { FetchResponse, successful } from '@/utils/fetch'
import { fullName } from '@/utils/string'

import useCoreMutation, {
  UseCoreMutationProps,
} from '@/hooks/use-core-mutation'

import { organizationsQueryKey } from '@/features/organization/hooks/use-get-organizations'

export type OrgInvitePayload = Partial<
  Omit<CreateEmailOptions, 'text' | 'html' | 'react' | 'from' | 'to'>
> &
  Pick<User, 'firstName' | 'lastName' | 'email'> &
  Pick<OrgMember, 'roles'>

type EmailResponse = Awaited<CreateEmailResponse>

type UseOrganizationInviteProps = {
  organizationId?: Organization['id']
  inviteId?: OrgInvitation['id']
  options?: UseCoreMutationProps<OrgInvitePayload, FetchResponse<EmailResponse>>
}

export const useOrganizationInvite = ({
  organizationId,
  inviteId,
  options,
}: UseOrganizationInviteProps) => {
  const queryClient = useQueryClient()

  const refreshData = useCallback(async () => {
    await queryClient.refetchQueries({
      queryKey: organizationsQueryKey.filtered({ id: organizationId }),
      exact: true,
    })
  }, [organizationId, queryClient])

  const createInvitation = useCoreMutation({
    url: `${CORE_API_ENDPOINTS.organization}/${organizationId}/invite`,
    method: 'POST',
    toast: { enabled: true, messages: { success: () => 'Invitation sent!' } },
    ...options,
    onSuccess: async () => {
      await refreshData()
    },
  })

  const updateInvitation = useCoreMutation({
    url: `${CORE_API_ENDPOINTS.organization}/${organizationId}/invite/${inviteId}`,
    method: 'PUT',
    ...options,
    onSuccess: async () => {
      await refreshData()
    },
  })

  const deleteInvitation = useCoreMutation<Partial<OrgInvitation>, {}>({
    url: `${CORE_API_ENDPOINTS.organization}/${organizationId}/invite/${inviteId}`,
    method: 'DELETE',
    ...(options as Omit<
      UseCoreMutationProps<Partial<OrgInvitation> | {}, {}>,
      'url' | 'method'
    >),
    // We allow a payload when the mutation is called to provide context for toasts.
    // We don't want to include it in the request though, so transform to empty payload.
    transform: () => ({}),
    toast: {
      enabled: true,
      messages: {
        success: ({ context }) => {
          const name = fullName(
            context?.inviteeFirstName,
            context?.inviteeLastName,
          )
          return `Invitation ${name ? `for ${name} ` : ''}has been canceled.`
        },
      },
    },
    onSuccess: async ({ status }) => {
      if (successful(status)) {
        await refreshData()
      }
    },
  })

  return { createInvitation, updateInvitation, deleteInvitation }
}
