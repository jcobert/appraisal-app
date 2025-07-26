import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server'
import { Organization } from '@prisma/client'
import { intersection } from 'lodash'
import { redirect } from 'next/navigation'

import {
  getOrgMemberRoles,
  getUserOrganizations,
} from '@/lib/db/queries/organization'
import { getActiveUserProfile } from '@/lib/db/queries/user'

import { objectEntries, objectKeys } from '@/utils/general'
import { homeUrl } from '@/utils/nav'

import { SessionData } from '@/types/auth'

import {
  APP_PERMISSIONS,
  PermissionAction,
  PermissionArea,
} from '@/configuration/permissions'

/** @todo Rename allowed to loggedIn if we're only checking session and not permissions. */
/** Returns user authentication status. For use server-side.  */
export const isAuthenticated = async () => {
  const session = getKindeServerSession()
  const isAuthenticated = await session.isAuthenticated()
  const user = await session.getUser()
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

/** Returns user session data, both from Kinde auth and core DB. */
export const getSessionData = async (): Promise<SessionData> => {
  const session = getKindeServerSession()
  const { getUser, isAuthenticated } = session
  // Auth (from Kinde DB)
  const user = await getUser()
  const loggedIn = !!(await isAuthenticated())
  // User data (from core DB)
  const profile = await getActiveUserProfile()
  const organizations = await getUserOrganizations()
  return { user, loggedIn, profile, organizations }
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

/**
 * Get all permissions for a user in an organization based on their roles.
 */
export const getUserPermissions = async (
  organizationId: Organization['id'],
): Promise<{ [Area in PermissionArea]: PermissionAction[Area][] }> => {
  const userRoles = await getOrgMemberRoles({ organizationId })

  const permsByArea = objectEntries(APP_PERMISSIONS)?.map(([area, actions]) => {
    const userAllowedActions = !userRoles?.length
      ? []
      : objectKeys(actions)?.filter((action) => {
          const allowedRoles = actions[action]
          return !!intersection(allowedRoles, userRoles)?.length
        })
    return [area, userAllowedActions]
  })
  return Object.fromEntries(permsByArea)
}

/**
 * Checks if a user has permission to perform a specific action in an organization.
 */
export const userCan = async <Area extends PermissionArea>({
  area,
  action,
  organizationId,
}: {
  area: Area
  action: PermissionAction[Area]
  organizationId: Organization['id']
}): Promise<boolean> => {
  const userRoles = await getOrgMemberRoles({ organizationId })
  if (!userRoles?.length) return false
  const allowedRoles = APP_PERMISSIONS[area][action]
  return !!intersection(allowedRoles, userRoles)?.length
}

/** Protects page server side by redirecting if user not authenticated. */
export const protectPage = async <Area extends PermissionArea>(options?: {
  /** By default, redirects home. Provide alternate path for redirect. */
  redirect?: string
  /** Specific permission that user must have to access page. */
  permission?: Parameters<typeof userCan<Area>>['0']
}) => {
  const { redirect: redir, permission } = options || {}
  const { allowed } = await isAuthenticated()
  const hasPermission = permission ? await userCan(permission) : true
  const can = allowed && hasPermission
  if (!can) {
    redirect(redir || homeUrl(allowed))
  }
  return { can, loggedIn: allowed, hasPermission }
}

/**
 * Higher-order function that wraps an async function with permission checking.
 */
export const withPermission = <Area extends PermissionArea, T>(
  area: Area,
  action: PermissionAction[Area],
  fn: (organizationId: Organization['id']) => Promise<T>,
) => {
  return async (organizationId: string): Promise<T | null> => {
    const hasPermission = await userCan({ area, action, organizationId })
    if (!hasPermission) return null
    return fn(organizationId)
  }
}
