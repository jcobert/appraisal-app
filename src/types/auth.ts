import {
  KindePermissions,
  KindeUser,
} from '@kinde-oss/kinde-auth-nextjs/dist/types'
import { User } from '@prisma/client'

export type SessionData = {
  user: KindeUser<Record<string, unknown>> | null
  loggedIn: boolean
  permissions: KindePermissions | null
  profile?: User | null
}
