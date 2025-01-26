import { Appraiser } from '@prisma/client'

import { CORE_API_ENDPOINTS } from '@/lib/db/config'

import { AppraiserFormData } from '@/components/features/appraiser/appraiser-form'

import useCoreMutation, {
  UseCoreMutationProps,
} from '@/hooks/use-core-mutation'

type UseAppraiserMutationsProps = {
  initialData?: Appraiser | null
  options?: UseCoreMutationProps<AppraiserFormData | {}, Appraiser>
}

export const useAppraiserMutations = ({
  initialData,
  options,
}: UseAppraiserMutationsProps = {}) => {
  const createAppraiser = useCoreMutation<AppraiserFormData, Appraiser>({
    url: CORE_API_ENDPOINTS.appraiser,
    method: 'POST',
    ...options,
  })

  const updateAppraiser = useCoreMutation<AppraiserFormData, Appraiser>({
    url: `${CORE_API_ENDPOINTS.appraiser}/${initialData?.id}`,
    method: 'PUT',
    ...options,
  })

  const deleteAppraiser = useCoreMutation<{}, Appraiser>({
    url: `${CORE_API_ENDPOINTS.appraiser}/${initialData?.id}`,
    method: 'DELETE',
    ...options,
  })

  const isPending =
    createAppraiser.isPending ||
    updateAppraiser.isPending ||
    deleteAppraiser.isPending

  const isSuccess =
    createAppraiser.isSuccess ||
    updateAppraiser.isSuccess ||
    deleteAppraiser.isSuccess

  const isError =
    createAppraiser.isError ||
    updateAppraiser.isError ||
    deleteAppraiser.isError

  return {
    createAppraiser,
    updateAppraiser,
    deleteAppraiser,
    isPending,
    isSuccess,
    isError,
  }
}
