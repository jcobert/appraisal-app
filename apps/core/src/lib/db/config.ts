export const CORE_API_ENDPOINTS = {
  user: '/api/core/user',
  organization: '/api/core/organization',
  order: ({
    organizationId,
    orderId,
  }: {
    organizationId: string
    orderId?: string
  }) => {
    if (!organizationId) return ''
    const base = `/api/core/organization/${organizationId}/orders`
    return orderId ? `${base}/${orderId}` : base
  },
  client: ({
    organizationId,
    clientId,
  }: {
    organizationId: string
    clientId?: string
  }) => {
    if (!organizationId) return ''
    const base = `/api/core/organization/${organizationId}/clients`
    return clientId ? `${base}/${clientId}` : base
  },
} as const

/** Number of days an org member invite is valid. */
export const ORG_INVITE_EXPIRY = 7
