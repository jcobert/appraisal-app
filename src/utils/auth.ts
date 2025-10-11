import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server'

/** @todo Rename allowed to loggedIn if we're only checking session and not permissions. */
/** Returns user authentication status. For use server-side.  */
export const isAuthenticated = async () => {
  const session = getKindeServerSession()
  const [isAuthenticated, user] = await Promise.all([
    session.isAuthenticated(),
    session.getUser(),
  ])
  if (!isAuthenticated || !user) {
    return { allowed: false, user }
  }
  return { allowed: true, user }
}

/** Returns the server session user. */
export const getActiveUserAccount = async () => {
  const session = getKindeServerSession()
  const user = await session.getUser()
  return user
}

/** Returns the auth login/logout route with the optional `redirect` query param. */
export const authUrl = ({
  type = 'login',
  redirectTo,
  absolute = false,
}: {
  type: 'login' | 'logout'
  redirectTo?: string
  absolute?: boolean
}) => {
  if (!type) throw new Error('Missing auth type ("login" or "logout").')
  const basePath = `${absolute ? process.env.NEXT_PUBLIC_SITE_BASE_URL : ''}/api/auth/${type}`
  const query = redirectTo
    ? `?post_${type}_redirect_url=${encodeURIComponent(redirectTo)}`
    : ''
  return `${basePath}${query}`
}
