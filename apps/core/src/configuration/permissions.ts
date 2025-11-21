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
 * Permission requirement that can specify role-based access, ownership requirements, or both.
 */
export type PermissionRequirement = {
  /** Roles that grant this permission. */
  roles: MemberRole[]
  /** Whether ownership is required to perform this action. */
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
