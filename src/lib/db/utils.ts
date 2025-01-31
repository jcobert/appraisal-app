import { PermissionKey, isAllowedServer } from '@/utils/auth'

export type CanQueryOptions = { permission?: PermissionKey }

/**
 * Returns whether user is authorized to query the core db.
 * Always returns `false` if user is not authenticated/there is no user session.
 *
 * Provide optional `permission` to check against the user's permissions.
 */
export const canQuery = async (options: CanQueryOptions = {}) => {
  const { permission } = options
  const { allowed } = await isAllowedServer(permission)
  return allowed
}
