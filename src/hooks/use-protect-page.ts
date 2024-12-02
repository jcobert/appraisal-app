import { useKindeBrowserClient } from '@kinde-oss/kinde-auth-nextjs'
import { useRouter } from 'next/navigation'

export const useProtectPage = () => {
  const router = useRouter()
  const session = useKindeBrowserClient()
  const { isAuthenticated, isLoading } = session

  const noSession = !isLoading && !isAuthenticated

  if (noSession) {
    router.push('/api/auth/login')
  }

  return { session }
}
