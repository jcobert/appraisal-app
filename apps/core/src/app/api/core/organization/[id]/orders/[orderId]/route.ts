import { NextRequest } from 'next/server'

import { toNextResponse } from '@/lib/db/api-handlers'
import { handleGetOrder } from '@/lib/db/handlers/order-handlers'

// ==============
//      GET
// ==============
export const GET = async (
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; orderId: string }> },
) => {
  const { id: organizationId, orderId } = await params

  const result = await handleGetOrder(organizationId, orderId)
  return toNextResponse(result)
}
