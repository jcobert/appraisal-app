import { useQueryClient } from '@tanstack/react-query'

import { Order, Organization } from '@repo/database'

import { CORE_API_ENDPOINTS } from '@/lib/db/config'
import { CreateOrderResult } from '@/lib/db/handlers/order-handlers'
import { OrderFormData } from '@/lib/db/schemas/order'

import useCoreMutation from '@/hooks/use-core-mutation'

import { ordersQueryKey } from '@/configuration/react-query/query-keys'

type Payload = OrderFormData

type Response = CreateOrderResult['data']

export type UseOrderMutationsProps = {
  organizationId: Organization['id']
  orderId?: Order['id']
}

export const useOrderMutations = ({
  organizationId,
  orderId,
}: UseOrderMutationsProps) => {
  const queryClient = useQueryClient()

  const createOrder = useCoreMutation<Payload, Response>({
    url: CORE_API_ENDPOINTS.order({ organizationId, orderId }),
    method: 'POST',
    toast: { messages: { success: () => 'New order created.' } },
    onSuccess: async () => {
      const queries = [
        queryClient.invalidateQueries({
          queryKey: ordersQueryKey.filtered({ organizationId }),
          exact: true,
        }),
      ]
      if (orderId) {
        queries.push(
          queryClient.invalidateQueries({
            queryKey: ordersQueryKey.filtered({ organizationId, orderId }),
            exact: true,
          }),
        )
      }
      await Promise.all(queries)
    },
  })

  return { createOrder }
}
