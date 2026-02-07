import { NextRequest } from 'next/server'

import { toNextResponse } from '@/lib/db/api-handlers'
import { handleCreateOrder } from '@/lib/db/handlers/order-handlers'
import { OrderApiData } from '@/lib/db/schemas/order'

// ==============
//      POST
// ==============
export const POST = async (req: NextRequest) => {
  const payload = (await req.json()) as OrderApiData

  const result = await handleCreateOrder(payload)
  return toNextResponse(result)
}
