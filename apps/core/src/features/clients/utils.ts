import { GetClientsResult } from '@/lib/db/handlers/client-handlers'

export const getClientAddress = (
  client: NonNullable<GetClientsResult['data']>[number] | null | undefined,
) => {
  if (!client) return { address: '', city: '', state: '', zip: '' }

  const parts = [client.street, client.city, client.state, client.zip].filter(
    Boolean,
  )

  return {
    address: parts.join(', ') || '',
    city: client.city || '',
    state: client.state || '',
    zip: client.zip || '',
  }
}
