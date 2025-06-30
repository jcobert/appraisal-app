import { OrgMember, Organization, User } from '@prisma/client'
import { CreateEmailOptions, CreateEmailResponse } from 'resend'

import { CORE_API_ENDPOINTS } from '@/lib/db/config'

import { FetchResponse } from '@/utils/fetch'

import useCoreMutation, {
  UseCoreMutationProps,
} from '@/hooks/use-core-mutation'

export type OrgInvitePayload = Partial<
  Omit<CreateEmailOptions, 'text' | 'html' | 'react' | 'from' | 'to'>
> &
  Pick<User, 'firstName' | 'lastName' | 'email'> &
  Pick<OrgMember, 'roles'>

type EmailResponse = Awaited<CreateEmailResponse>

type UseOrganizationInviteProps = {
  organization?: Organization | null
  options?: UseCoreMutationProps<OrgInvitePayload, FetchResponse<EmailResponse>>
}

export const useOrganizationInvite = ({
  organization,
  options,
}: UseOrganizationInviteProps) => {
  const mutation = useCoreMutation({
    url: `${CORE_API_ENDPOINTS.organization}/${organization?.id}/invite`,
    method: 'POST',
    ...options,
  })
  return mutation
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
