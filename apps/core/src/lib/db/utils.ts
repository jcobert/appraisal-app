// sort-imports-ignore
import 'server-only'

import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server'
import { Organization } from '@repo/database'
import { intersection } from 'lodash'

import { isAuthenticated } from '@/utils/auth'
import { objectKeys } from '@repo/utils'

import { APP_PERMISSIONS, PermissionAction } from '@/configuration/permissions'
import { redirect } from 'next/navigation'
import { homeUrl } from '@/utils/nav'
import { handleGetActiveUserOrgMember } from '@/lib/db/handlers/organization-member-handlers'
import { SessionData } from '@/types/auth'

/** Returns active user account (Kinde auth DB) and login status. Profile and organizations should be fetched client-side via React Query hooks for reactive updates. */
export const getSessionData = async (): Promise<SessionData> => {
  const session = getKindeServerSession()
  const { getUser, isAuthenticated } = session
  // User account (from Kinde DB)
  const account = await getUser()
  const loggedIn = !!(await isAuthenticated())
  return { account, loggedIn }
}

/**
 * Get all permissions for a user in an organization based on their roles and ownership status.
 */
export const getUserPermissions = async (
  organizationId: Organization['id'],
): Promise<PermissionAction[]> => {
  try {
    const {
      active,
      roles = [],
      isOwner = false,
    } = (await handleGetActiveUserOrgMember(organizationId))?.data || {}
    const userRoles = !active ? [] : roles

    const userAllowedActions: PermissionAction[] = objectKeys(
      APP_PERMISSIONS,
    )?.filter((action) => {
      const requirement = APP_PERMISSIONS[action]
      // If ownership is required, check ownership.
      if (requirement.requiresOwner) {
        return isOwner
      }
      // Otherwise check roles based on roleConstraint.
      const constraint = requirement.roleConstraint || 'any'
      const sharedRoles = intersection(requirement.roles, userRoles)

      if (constraint === 'all') {
        // User must have ALL required roles
        return sharedRoles.length === requirement.roles.length
      }
      // Default: User needs at least ONE required role
      return sharedRoles.length > 0
    })
    return userAllowedActions
  } catch (error) {
    // If database query fails, return empty permissions (no access).
    // This ensures the function always returns a valid permissions object.
    // eslint-disable-next-line no-console
    console.error('Error fetching user permissions:', error)
    return []
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
 * Leverages getUserPermissions for consistent permission logic.
 */
export const userCan = async ({
  action,
  organizationId,
}: {
  action: PermissionAction
  organizationId: Organization['id']
}): Promise<boolean> => {
  const permissions = await getUserPermissions(organizationId)
  return permissions.includes(action)
}

/** Protects page server side by redirecting if user not authorized. */
export const protectPage = async (options?: {
  /** By default, redirects home. Provide alternate path for redirect. */
  redirect?: string
  /** Specific permission that user must have to access page. */
  permission?: Parameters<typeof userCan>['0']
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
export const withPermission = <T>(
  action: PermissionAction,
  fn: (organizationId: Organization['id']) => Promise<T>,
) => {
  return async (organizationId: string): Promise<T | null> => {
    const hasPermission = await userCan({ action, organizationId })
    if (!hasPermission) return null
    return fn(organizationId)
  }
}
