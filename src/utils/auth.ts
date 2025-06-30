import { KindePermissions } from '@kinde-oss/kinde-auth-nextjs/dist/types'
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server'
import { redirect } from 'next/navigation'

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

/** Returns the auth login route with the provided `url` as the redirect param. */
export const authRedirectUrl = (url: string) => {
  return `/api/auth/login?post_login_redirect_url=${url}`
}
