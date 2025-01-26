import { Appraiser } from '@prisma/client'

import { CORE_API_ENDPOINTS } from '@/lib/db/config'

import { exists } from '@/utils/general'
import { digitString } from '@/utils/string'

import useCoreMutation, {
  UseCoreMutationProps,
} from '@/hooks/use-core-mutation'

type Payload = Partial<Appraiser>

type UseAppraiserMutationsProps = {
  initialData?: Appraiser | null
  options?: UseCoreMutationProps<Payload | {}, Appraiser>
}

const transform = (payload: Payload): Payload => {
  return {
    ...payload,
    phone: exists(payload?.phone, { allowEmptyString: true })
      ? digitString(payload.phone!) || payload?.phone
      : undefined,
  }
}

export const useAppraiserMutations = ({
  initialData,
  options,
}: UseAppraiserMutationsProps = {}) => {
  const createAppraiser = useCoreMutation<Payload, Appraiser>({
    url: CORE_API_ENDPOINTS.appraiser,
    method: 'POST',
    transform,
    ...options,
  })

  const updateAppraiser = useCoreMutation<Payload, Appraiser>({
    url: `${CORE_API_ENDPOINTS.appraiser}/${initialData?.id}`,
    method: 'PUT',
    transform,
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
