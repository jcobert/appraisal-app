import { NextRequest } from 'next/server'

import { toNextResponse } from '@/lib/db/api-handlers'
import {
  handleCreateOrder,
  handleGetOrders,
} from '@/lib/db/handlers/order-handlers'
import { OrderApiData } from '@/lib/db/schemas/order'

// ==============
//      POST
// ==============
export const POST = async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) => {
  const { id: organizationId } = await params
  const payload = (await req.json()) as OrderApiData

  const result = await handleCreateOrder(organizationId, payload)
  return toNextResponse(result)
}

// ==============
//      GET
// ==============
export const GET = async (
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) => {
  const { id: organizationId } = await params

  const result = await handleGetOrders(organizationId)
  return toNextResponse(result)
}
