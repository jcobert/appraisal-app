import { isAuthenticated } from '@/utils/auth'

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
