// sort-imports-ignore
import 'server-only'

import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server'
import { Organization } from '@prisma/client'
import { intersection } from 'lodash'

import { getActiveUserProfile } from '@/lib/db/queries/user'

import { isAuthenticated } from '@/utils/auth'
import { objectEntries, objectKeys } from '@/utils/general'

import {
  APP_PERMISSIONS,
  PermissionAction,
  PermissionArea,
} from '@/configuration/permissions'
import { redirect } from 'next/navigation'
import { homeUrl } from '@/utils/nav'
import { db } from '@/lib/db/client'
import { handleGetActiveUserOrgMember } from '@/lib/db/handlers/organization-member-handlers'

/** Returns user session (account) and profile data, both from Kinde auth and core DB. */
export const getSessionData = async () => {
  const session = getKindeServerSession()
  const { getUser, isAuthenticated } = session
  // Auth (from Kinde DB)
  const user = await getUser()
  const loggedIn = !!(await isAuthenticated())
  // User data (from core DB)
  const profile = await getActiveUserProfile()
  const organizations = await db.organization.findMany({
    where: {
      members: {
        some: {
          user: { accountId: user?.id },
        },
      },
    },
  })
  return { user, loggedIn, profile, organizations }
}

/**
 * Get all permissions for a user in an organization based on their roles.
 */
export const getUserPermissions = async (
  organizationId: Organization['id'],
): Promise<{ [Area in PermissionArea]: PermissionAction[Area][] }> => {
  try {
    const { active, roles = [] } =
      (await handleGetActiveUserOrgMember(organizationId))?.data || {}
    const userRoles = !active ? [] : roles

    const permsByArea = objectEntries(APP_PERMISSIONS)?.map(
      ([area, actions]) => {
        const userAllowedActions: (keyof typeof actions)[] = !userRoles?.length
          ? []
          : objectKeys(actions)?.filter((action) => {
              const allowedRoles = actions[action]
              return !!intersection(allowedRoles, userRoles)?.length
            })
        return [area, userAllowedActions]
      },
    )
    return Object.fromEntries(permsByArea)
  } catch (error) {
    // If database query fails, return empty permissions (no access).
    // This ensures the function always returns a valid permissions object.
    // eslint-disable-next-line no-console
    console.error('Error fetching user permissions:', error)
    const permsByArea = objectEntries(APP_PERMISSIONS)?.map(([area]) => [
      area,
      [],
    ])
    return Object.fromEntries(permsByArea)
  }
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
  try {
    const { active, roles = [] } =
      (await handleGetActiveUserOrgMember(organizationId))?.data || {}
    const userRoles = !active ? [] : roles
    if (!userRoles?.length) return false
    const allowedRoles = APP_PERMISSIONS[area][action]
    return !!intersection(allowedRoles, userRoles)?.length
  } catch (error) {
    // If database query fails, deny permission (fail safe)
    // eslint-disable-next-line no-console
    console.error('Error checking user permissions:', error)
    return false
  }
}

/** Protects page server side by redirecting if user not authorized. */
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
