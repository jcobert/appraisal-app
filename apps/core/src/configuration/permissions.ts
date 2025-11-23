import { MemberRole } from '@repo/database'

/**
 * All permission actions in the application.
 * Uses colon-separated notation (resource:action) following industry standards.
 * All permissions are organization-scoped.
 */
export type PermissionAction =
  | 'organization:edit'
  | 'members:edit'
  | 'organization:delete'
  | 'organization:transfer'
  | 'organization:view'
  | 'members:view_details'
  | 'orders:create'
  | 'orders:edit'
  | 'orders:delete'
  | 'orders:view'

/**
 * Permission requirement that can specify role-based access OR ownership requirements.
 * If requiresOwner is true, only the owner has this permission (roles are ignored).
 * If requiresOwner is false/undefined, users with matching roles have this permission.
 */
export type PermissionRequirement = {
  /** Roles that grant this permission (ignored if requiresOwner is true). */
  roles: MemberRole[]
  /**
   * Whether user must have all roles to have permission or can have any (at least one).
   * Default is 'any'.
   */
  roleConstraint?: 'any' | 'all'
  /** Whether ownership is required. If true, only owner has access regardless of roles. */
  requiresOwner?: boolean
}

/**
 * Mapping of actions around the app to their permission requirements.
 * This is our single source of truth for role-based and ownership-based permissions.
 * All permissions are scoped to organizations.
 */
export const APP_PERMISSIONS: Record<PermissionAction, PermissionRequirement> =
  {
    'organization:view': { roles: ['admin', 'manager', 'appraiser'] },
    'organization:edit': { roles: ['admin'] },
    'members:edit': { roles: ['admin'] },
    'organization:delete': { roles: [], requiresOwner: true },
    'organization:transfer': { roles: [], requiresOwner: true },
    'members:view_details': { roles: ['admin', 'manager'] },
    'orders:create': { roles: ['admin', 'manager', 'appraiser'] },
    'orders:edit': { roles: ['admin', 'manager', 'appraiser'] },
    'orders:delete': { roles: ['admin', 'manager'] },
    'orders:view': { roles: ['admin', 'manager', 'appraiser'] },
  }
