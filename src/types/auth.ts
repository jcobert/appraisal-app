import {
  KindePermissions,
  KindeUser,
} from '@kinde-oss/kinde-auth-nextjs/dist/types'

export type SessionData = {
  user: KindeUser<Record<string, unknown>> | null
  loggedIn: boolean
  permissions: KindePermissions | null
}
