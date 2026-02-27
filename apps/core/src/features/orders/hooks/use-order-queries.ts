import { CORE_API_ENDPOINTS } from '@/lib/db/config'
import {
  GetOrderResult,
  GetOrdersResult,
} from '@/lib/db/handlers/order-handlers'

import useCoreQuery, { UseCoreQueryProps } from '@/hooks/use-core-query'

import { ordersQueryKey } from '@/configuration/react-query/query-keys'

type FindManyProps = {
  organizationId: string
  options?: Partial<UseCoreQueryProps<GetOrdersResult['data']>>
}

export const useGetOrders = ({ organizationId, options }: FindManyProps) => {
  const { enabled = true, ...opts } = options || {}
  return useCoreQuery({
    url: CORE_API_ENDPOINTS.order({ organizationId }),
    queryKey: ordersQueryKey.filtered({ organizationId }),
    enabled: !!organizationId && enabled,
    ...opts,
  })
}

type FindOneProps = {
  organizationId: string
  orderId: string
  options?: Partial<UseCoreQueryProps<GetOrderResult['data']>>
}

export const useGetOrder = ({
  organizationId,
  orderId,
  options,
}: FindOneProps) => {
  const { enabled = true, ...opts } = options || {}
  return useCoreQuery({
    url: CORE_API_ENDPOINTS.order({ organizationId, orderId }),
    queryKey: ordersQueryKey.filtered({ organizationId, orderId }),
    enabled: !!organizationId && !!orderId && enabled,
    ...opts,
  })
}
