import { useKindeBrowserClient } from '@kinde-oss/kinde-auth-nextjs'
import { useRouter } from 'next/navigation'

import { authUrl } from '@/utils/auth'

/** @todo Add post-login redirect option? */
/** Checks auth status client side and redirects to login page if not logged in. */
export const useProtectPage = () => {
  const router = useRouter()
  const session = useKindeBrowserClient()
  const { isAuthenticated, isLoading } = session

  const noSession = !isLoading && !isAuthenticated

  if (noSession) {
    // router.push('/api/auth/login')
    router.push(authUrl({ type: 'login' }))
  }

  return { session }
}
