import { NextRequest } from 'next/server'

import { toNextResponse } from '@/lib/db/api-handlers'
import {
  handleCreateClient,
  handleGetClients,
} from '@/lib/db/handlers/client-handlers'
import { ClientApiData } from '@/lib/db/schemas/client'

// ==============
//      POST
// ==============
export const POST = async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) => {
  const { id: organizationId } = await params
  const payload = (await req.json()) as ClientApiData

  const result = await handleCreateClient(organizationId, payload)
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

  const result = await handleGetClients(organizationId)
  return toNextResponse(result)
}
