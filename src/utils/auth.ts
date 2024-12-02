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
  permissions: KindePermissions | null,
  action: PermissionKey,
) => {
  const userPermission = getUserPermissions(permissions)?.find(
    (perm) => perm?.key === action,
  )

  return !!userPermission?.allowed
}

export const isAllowedServer = async (action?: PermissionKey) => {
  const session = getKindeServerSession()
  if (!(await session.isAuthenticated())) {
    return false
  }
  return !!action ? isAllowed(await session?.getPermissions(), action) : true
}

export const protectPage = async (
  action?: PermissionKey,
  url: string = '/',
) => {
  const isAllowed = await isAllowedServer(action)
  if (!isAllowed) {
    redirect(url)
  }
}
