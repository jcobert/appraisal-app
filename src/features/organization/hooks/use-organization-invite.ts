import { OrgInvitation, OrgMember, Organization, User } from '@prisma/client'
import { useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'
import { CreateEmailOptions, CreateEmailResponse } from 'resend'

import { CORE_API_ENDPOINTS } from '@/lib/db/config'

import { FetchResponse } from '@/utils/fetch'

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
  }, [organizationId])

  const createInvitation = useCoreMutation({
    url: `${CORE_API_ENDPOINTS.organization}/${organizationId}/invite`,
    method: 'POST',
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

  return { createInvitation, updateInvitation }
}

// // GET

// type UseGetOrganizationInvitesProps = {
//   organizationId?: Organization['id']
//   options?: UseCoreQueryProps
// }

// export const orgInvitesQueryKey = {
//   all: ['org-invites'],
//   filtered: (params: Partial<OrgInvitation>) =>
//     filteredQueryKey(params, orgInvitesQueryKey.all),
// } as const

// export const useGetOrganizationInvites = ({
//   organizationId,
//   options,
// }: UseGetOrganizationInvitesProps) => {
//   const query = useCoreQuery({
//     queryKey: orgInvitesQueryKey.filtered({ organizationId }),
//     url: `${CORE_API_ENDPOINTS.organization}/${organizationId}`,
//     ...options,
//   })
//   return query
// }
