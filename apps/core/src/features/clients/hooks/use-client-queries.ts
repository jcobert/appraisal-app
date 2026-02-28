import { CORE_API_ENDPOINTS } from '@/lib/db/config'
import {
  GetClientResult,
  GetClientsResult,
} from '@/lib/db/handlers/client-handlers'

import useCoreQuery, { UseCoreQueryProps } from '@/hooks/use-core-query'

import { clientsQueryKey } from '@/configuration/react-query/query-keys'

type FindManyProps = {
  organizationId: string
  options?: Partial<UseCoreQueryProps<GetClientsResult['data']>>
}

export const useGetClients = ({ organizationId, options }: FindManyProps) => {
  const { enabled = true, ...opts } = options || {}
  return useCoreQuery({
    url: CORE_API_ENDPOINTS.client({ organizationId }),
    queryKey: clientsQueryKey.filtered({ organizationId }),
    enabled: !!organizationId && enabled,
    ...opts,
  })
}

type FindOneProps = {
  organizationId: string
  clientId: string
  options?: Partial<UseCoreQueryProps<GetClientResult['data']>>
}

export const useGetClient = ({
  organizationId,
  clientId,
  options,
}: FindOneProps) => {
  const { enabled = true, ...opts } = options || {}
  return useCoreQuery({
    url: CORE_API_ENDPOINTS.client({ organizationId, clientId }),
    queryKey: clientsQueryKey.filtered({ organizationId, clientId }),
    enabled: !!organizationId && !!clientId && enabled,
    ...opts,
  })
}
