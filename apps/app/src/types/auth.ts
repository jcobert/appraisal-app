import { KindeUser } from '@kinde-oss/kinde-auth-nextjs'

import { Organization, User } from '@repo/database'

/** Session user data provided by Kinde. */
export type SessionUser = KindeUser<Record<string, unknown>>

/** Various user profile and session data. */
export type SessionData = {
  account: SessionUser | null
  loggedIn: boolean
  profile: User | null
  organizations: Organization[]
}
