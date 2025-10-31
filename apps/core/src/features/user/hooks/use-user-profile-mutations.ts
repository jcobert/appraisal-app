import { useQueryClient } from '@tanstack/react-query'

import { User } from '@repo/database'
import { digitString, exists } from '@repo/utils'

import { CORE_API_ENDPOINTS } from '@/lib/db/config'

import useCoreMutation, {
  UseCoreMutationProps,
} from '@/hooks/use-core-mutation'

import { usersQueryKey } from '@/configuration/react-query/query-keys'

type Payload = Partial<User>

type UseUserMutationsProps = {
  initialData?: User | null
  options?: UseCoreMutationProps<Payload | {}, User>
}

const transform = (payload: Payload): Payload => {
  return {
    ...payload,
    phone: exists(payload?.phone, { allowEmptyString: true })
      ? digitString(payload.phone!) || payload?.phone
      : undefined,
  }
}

export const useUserMutations = ({ options }: UseUserMutationsProps = {}) => {
  const queryClient = useQueryClient()

  const createUser = useCoreMutation<Payload, User>({
    url: CORE_API_ENDPOINTS.user,
    method: 'POST',
    transform,
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: usersQueryKey.all,
        type: 'all',
      })
    },
    ...options,
  })

  const updateUser = useCoreMutation<Payload, User>({
    url: `${CORE_API_ENDPOINTS.user}/active`,
    method: 'PUT',
    transform,
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: usersQueryKey.all,
        type: 'all',
      })
    },
    ...options,
  })

  // const deleteUser = useCoreMutation<{}, User>({
  //   url: `${CORE_API_ENDPOINTS.user}/active`,
  //   method: 'DELETE',
  //   ...options,
  // })

  const isPending = createUser.isPending || updateUser.isPending
  // || deleteUser.isPending

  const isSuccess = createUser.isSuccess || updateUser.isSuccess
  // || deleteUser.isSuccess

  const isError = createUser.isError || updateUser.isError
  // || deleteUser.isError

  return {
    createUser,
    updateUser,
    // deleteUser,
    isPending,
    isSuccess,
    isError,
  }
}
