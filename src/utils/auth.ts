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

export const isAllowed = (
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
  if (!(await session.isAuthenticated())) {
    return false
  }
  return !!permission
    ? isAllowed(await session?.getPermissions(), permission)
    : true
}

export type ProtectOptions = {
  permission?: PermissionKey
  redirectUrl?: string
}

export const protect = async (options: ProtectOptions = {}) => {
  const { permission, redirectUrl = '/' } = options
  const isAllowed = await isAllowedServer(permission)
  if (!isAllowed) {
    redirect(redirectUrl)
  }
}
