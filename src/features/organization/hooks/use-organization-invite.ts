import { Organization, User } from '@prisma/client'
import { CreateEmailOptions, CreateEmailResponse } from 'resend'

import { CORE_API_ENDPOINTS } from '@/lib/db/config'

import { FetchResponse } from '@/utils/fetch'

import useCoreMutation, {
  UseCoreMutationProps,
} from '@/hooks/use-core-mutation'

export type EmailPayload = Partial<
  Omit<CreateEmailOptions, 'text' | 'html' | 'react' | 'from' | 'to'>
> &
  Pick<User, 'firstName' | 'lastName' | 'email'>

type EmailResponse = Awaited<CreateEmailResponse>

// type UseEmailOptions<TPayload extends EmailPayload> = UseMutationOptions<
//   FetchResponse<EmailResponse>,
//   DefaultError,
//   TPayload,
//   unknown
// >

type UseOrganizationInviteProps = {
  organization?: Organization | null
  options?: UseCoreMutationProps<EmailPayload, FetchResponse<EmailResponse>>
}

export const useOrganizationInvite = ({
  organization,
  options,
}: UseOrganizationInviteProps) => {
  // const mutation = useMutation({
  //   mutationKey: ['email-send'],
  //   mutationFn: (payload) =>
  //     fetch.POST<TPayload, EmailResponse>({
  //       url: '/api/core/organization/invite',
  //       payload,
  //     }),
  //   ...options,
  // })
  const mutation = useCoreMutation({
    url: `${CORE_API_ENDPOINTS.organization}/${organization?.id}/invite`,
    method: 'POST',
    ...options,
  })
  return mutation
}
