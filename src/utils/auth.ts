import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server'
import { KindePermissions } from '@kinde-oss/kinde-auth-nextjs/types'
import { redirect } from 'next/navigation'

import { getUserOrganizations } from '@/lib/db/queries/organization'
import { getActiveUserProfile } from '@/lib/db/queries/user'

import { SessionData } from '@/types/auth'

export enum Permission {
  read = 'Read',
  write = 'Write',
}

export type PermissionKey = keyof typeof Permission

export type UserPermission = {
  key: PermissionKey
  name: Permission
  allowed: boolean
}

export const getUserPermissions = (
  kindePermissions: KindePermissions | null,
  options: { all?: boolean } = { all: false },
) => {
  const permissions = (kindePermissions?.permissions as PermissionKey[]) || []

  const permissionsMap = (Object.keys(Permission) as PermissionKey[])?.map(
    (perm) => {
      return {
        key: perm,
        name: Permission[perm],
        allowed: permissions?.includes(perm),
      } as UserPermission
    },
  )

  return options?.all
    ? permissionsMap
    : permissionsMap?.filter((perm) => perm?.allowed)
}

export const hasPermission = (
  userPermissions: KindePermissions | null,
  permission: PermissionKey,
) => {
  const userPermission = getUserPermissions(userPermissions)?.find(
    (perm) => perm?.key === permission,
  )
  return !!userPermission?.allowed
}

export const isAllowedServer = async (permission?: PermissionKey) => {
  const session = getKindeServerSession()
  const isAuthenticated = await session.isAuthenticated()
  const user = await session.getUser()
  if (!isAuthenticated || !user) {
    return { allowed: false, user }
  }
  const allowed = !!permission
    ? hasPermission(await session?.getPermissions(), permission)
    : true
  return { allowed, user }
}

export type ProtectOptions = {
  permission?: PermissionKey
  redirectUrl?: string
  redirect?: boolean
}

/** Protects page server side by redirecting if user not authenticated. */
export const protectPage = async (options: ProtectOptions = {}) => {
  const {
    permission,
    redirectUrl = '/',
    redirect: shouldRedirect = true,
  } = options
  const { allowed } = await isAllowedServer(permission)
  if (!allowed) {
    if (shouldRedirect) {
      redirect(redirectUrl)
    }
  }
  return allowed
}

/** Returns the server session user. */
export const getActiveUserAccount = async () => {
  const session = getKindeServerSession()
  const user = await session.getUser()
  return user
}

/** Returns user session data, both from Kinde auth and DB. */
export const getSessionData = async (): Promise<SessionData> => {
  const session = getKindeServerSession()
  const { getUser, isAuthenticated, getPermissions } = session
  // From Kinde DB
  const user = await getUser()
  const loggedIn = !!(await isAuthenticated())
  const permissions = await getPermissions()
  // From core DB
  const profile = await getActiveUserProfile()
  const organizations = await getUserOrganizations()
  return { user, loggedIn, permissions, profile, organizations }
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
