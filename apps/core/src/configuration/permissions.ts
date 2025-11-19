import { MemberRole } from '@repo/database'

/** @todo Separate orders area doesn't make sense. Remove. */
/**
 * Areas of the application where permissions are required.
 */
export type PermissionArea = 'organization' | 'orders'

/**
 * Actions that can be performed in different areas of the application
 */
export type PermissionAction = {
  organization:
    | 'edit_org_info'
    | 'edit_org_members'
    | 'delete_org'
    | 'transfer_org'
    | 'view_org'
    | 'view_org_member_details'
  orders: 'create_order' | 'edit_order' | 'delete_order' | 'view_orders'
}

/**
 * Mapping of actions around the app to allowed user roles.
 * This is our single source of truth for role-based permissions.
 *
 * Note: Some actions are owner-only and should be checked separately
 * using the isOwner field rather than roles array.
 */
export const APP_PERMISSIONS: {
  [Area in PermissionArea]: {
    [Action in PermissionAction[Area]]: MemberRole[]
  }
} = {
  organization: {
    view_org: ['admin', 'manager', 'appraiser'],
    edit_org_info: ['admin'], // Admin or owner
    edit_org_members: ['admin'], // Admin or owner
    delete_org: [], // Owner-only: check isOwner field
    transfer_org: [], // Owner-only: check isOwner field
    view_org_member_details: ['admin', 'manager'],
  },
  /** @todo Move these under organization. */
  orders: {
    create_order: ['admin', 'manager', 'appraiser'],
    edit_order: ['admin', 'manager', 'appraiser'],
    delete_order: ['admin', 'manager'],
    view_orders: ['admin', 'manager', 'appraiser'],
  },
}
