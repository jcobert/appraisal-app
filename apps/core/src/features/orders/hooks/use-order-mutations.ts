import { Order, Organization } from '@repo/database'

import { CORE_API_ENDPOINTS } from '@/lib/db/config'
import { CreateOrderResult } from '@/lib/db/handlers/order-handlers'
import { OrderFormData } from '@/lib/db/schemas/order'

import useCoreMutation from '@/hooks/use-core-mutation'

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
  const createOrder = useCoreMutation<Payload, Response>({
    url: CORE_API_ENDPOINTS.order({ organizationId, orderId }),
    method: 'POST',
    toast: { messages: { success: () => 'New order created.' } },
  })

  return { createOrder }
}
