import { Appraiser } from '@prisma/client'

import { CORE_API_ENDPOINTS } from '@/lib/db/config'

import { filteredQueryKey } from '@/utils/query'

import useCoreQuery, { UseCoreQueryProps } from '@/hooks/use-core-query'

export const appraisersQueryKey = {
  all: ['appraisers'],
  filtered: (params: Appraiser) =>
    filteredQueryKey(params, appraisersQueryKey.all),
} as const

export const useGetAppraisers = (
  options?: Partial<UseCoreQueryProps<Appraiser[]>>,
) => {
  return useCoreQuery<Appraiser[]>({
    url: CORE_API_ENDPOINTS.appraiser,
    queryKey: appraisersQueryKey.all,
    ...options,
  })
}
