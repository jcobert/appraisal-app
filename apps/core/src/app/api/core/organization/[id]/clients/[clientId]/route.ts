import { NextRequest } from 'next/server'

import { toNextResponse } from '@/lib/db/api-handlers'
import {
  handleGetClient,
  handleUpdateClient,
} from '@/lib/db/handlers/client-handlers'
import { ClientApiData } from '@/lib/db/schemas/client'

// ==============
//      GET
// ==============
export const GET = async (
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; clientId: string }> },
) => {
  const { id: organizationId, clientId } = await params

  const result = await handleGetClient(organizationId, clientId)
  return toNextResponse(result)
}

// ==============
//     PATCH
// ==============
export const PATCH = async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string; clientId: string }> },
) => {
  const { id: organizationId, clientId } = await params
  const payload = (await req.json()) as Partial<ClientApiData>

  const result = await handleUpdateClient(organizationId, clientId, payload)
  return toNextResponse(result)
}
