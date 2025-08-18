// sort-imports-ignore
import 'server-only'

import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server'
import { Organization } from '@prisma/client'
import { intersection } from 'lodash'

import {
  getActiveUserOrgMember,
  getUserOrganizations,
} from '@/lib/db/queries/organization'
import { getActiveUserProfile } from '@/lib/db/queries/user'

import { isAuthenticated } from '@/utils/auth'
import { objectEntries, objectKeys } from '@/utils/general'

import { SessionData } from '@/types/auth'

import {
  APP_PERMISSIONS,
  PermissionAction,
  PermissionArea,
} from '@/configuration/permissions'
import { redirect } from 'next/navigation'
import { homeUrl } from '@/utils/nav'

/** Returns user session (account) and profile data, both from Kinde auth and core DB. */
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

/**
 * Get all permissions for a user in an organization based on their roles.
 */
export const getUserPermissions = async (
  organizationId: Organization['id'],
): Promise<{ [Area in PermissionArea]: PermissionAction[Area][] }> => {
  const { active, roles = [] } =
    (await getActiveUserOrgMember({ organizationId })) || {}
  const userRoles = !active ? [] : roles

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

export type CanQueryOptions = {}

/**
 * Returns whether user is authorized to query the core db.
 * Always returns `false` if user is not authenticated/there is no user session.
 *
 * Provide optional `permission` to check against the user's permissions.
 */
export const canQuery = async (_options: CanQueryOptions = {}) => {
  const { allowed } = await isAuthenticated()
  return allowed
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
  const { active, roles = [] } =
    (await getActiveUserOrgMember({ organizationId })) || {}
  const userRoles = !active ? [] : roles
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
