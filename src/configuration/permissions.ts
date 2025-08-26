import { MemberRole } from '@prisma/client'

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
    | 'view_org'
    | 'view_org_member_details'
  orders: 'create_order' | 'edit_order' | 'delete_order' | 'view_orders'
}

/**
 * Mapping of actions around the app to allowed user roles.
 * This is our single source of truth for role-based permissions.
 */
export const APP_PERMISSIONS: {
  [Area in PermissionArea]: {
    [Action in PermissionAction[Area]]: MemberRole[]
  }
} = {
  organization: {
    view_org: ['owner', 'appraiser', 'manager'],
    edit_org_info: ['owner'],
    edit_org_members: ['owner'],
    delete_org: ['owner'],
    view_org_member_details: ['owner', 'manager'],
  },
  /** @todo Move these under organization. */
  orders: {
    create_order: ['owner', 'manager', 'appraiser'],
    edit_order: ['owner', 'manager', 'appraiser'],
    delete_order: ['owner', 'manager'],
    view_orders: ['owner', 'manager', 'appraiser'],
  },
}
