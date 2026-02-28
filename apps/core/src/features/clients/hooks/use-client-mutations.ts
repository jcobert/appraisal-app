import { useQueryClient } from '@tanstack/react-query'

import { Client, Organization } from '@repo/database'

import { CORE_API_ENDPOINTS } from '@/lib/db/config'
import {
  CreateClientResult,
  UpdateClientResult,
} from '@/lib/db/handlers/client-handlers'
import { ClientFormData } from '@/lib/db/schemas/client'

import useCoreMutation from '@/hooks/use-core-mutation'

import { clientsQueryKey } from '@/configuration/react-query/query-keys'

type CreatePayload = ClientFormData
type UpdatePayload = Partial<ClientFormData>

type CreateResponse = CreateClientResult['data']
type UpdateResponse = UpdateClientResult['data']

export type UseClientMutationsProps = {
  organizationId: Organization['id']
  clientId?: Client['id']
}

export const useClientMutations = ({
  organizationId,
  clientId,
}: UseClientMutationsProps) => {
  const queryClient = useQueryClient()

  const createClient = useCoreMutation<CreatePayload, CreateResponse>({
    url: CORE_API_ENDPOINTS.client({ organizationId }),
    method: 'POST',
    toast: { messages: { success: () => 'New client created.' } },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: clientsQueryKey.filtered({ organizationId }),
        exact: true,
      })
    },
  })

  const updateClient = useCoreMutation<UpdatePayload, UpdateResponse>({
    url: CORE_API_ENDPOINTS.client({ organizationId, clientId }),
    method: 'PATCH',
    toast: { messages: { success: () => 'Client updated.' } },
    onSuccess: async () => {
      const queries = [
        queryClient.invalidateQueries({
          queryKey: clientsQueryKey.filtered({ organizationId }),
          exact: true,
        }),
      ]
      if (clientId) {
        queries.push(
          queryClient.invalidateQueries({
            queryKey: clientsQueryKey.filtered({ organizationId, clientId }),
            exact: true,
          }),
        )
      }
      await Promise.all(queries)
    },
  })

  return { createClient, updateClient }
}
