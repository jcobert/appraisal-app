import { configType } from '@kinde/management-api-js/dist/config'

export const kindeManagementConfig = {
  kindeDomain: process.env.KINDE_DOMAIN!,
  clientId: process.env.KINDE_MANAGEMENT_CLIENT_ID,
  clientSecret: process.env.KINDE_MANAGEMENT_CLIENT_SECRET,
} satisfies Pick<configType, 'kindeDomain' | 'clientId' | 'clientSecret'>
