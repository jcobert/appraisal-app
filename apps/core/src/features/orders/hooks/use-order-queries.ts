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
  return useCoreQuery({
    url: CORE_API_ENDPOINTS.order({ organizationId }),
    queryKey: ordersQueryKey.filtered({ organizationId }),
    ...options,
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
  return useCoreQuery({
    url: CORE_API_ENDPOINTS.order({ organizationId, orderId }),
    queryKey: ordersQueryKey.filtered({ organizationId, orderId }),
    ...options,
  })
}
