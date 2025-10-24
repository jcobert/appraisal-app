import { init } from '@kinde/management-api-js'

export type KindeManagementConfig = Parameters<typeof init>['0']

export const kindeManagementConfig = {
  kindeDomain: process.env.KINDE_DOMAIN!,
  clientId: process.env.KINDE_MANAGEMENT_CLIENT_ID,
  clientSecret: process.env.KINDE_MANAGEMENT_CLIENT_SECRET,
} satisfies KindeManagementConfig
