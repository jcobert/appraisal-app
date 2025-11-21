import { KindeUser } from '@kinde-oss/kinde-auth-nextjs'

import { Organization, User } from '@repo/database'

/** Session user data provided by Kinde. */
export type SessionUser = KindeUser<Record<string, unknown>>

/** Core authentication session data from Kinde. */
export type SessionData = {
  account: SessionUser | null
  loggedIn: boolean
}
