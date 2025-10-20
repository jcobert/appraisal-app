export const CORE_API_ENDPOINTS = {
  user: '/api/core/user',
  organization: '/api/core/organization',
} as const

/** Number of days an org member invite is valid. */
export const ORG_INVITE_EXPIRY = 7
