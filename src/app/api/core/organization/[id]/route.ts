import { NextRequest } from 'next/server'
import { z } from 'zod'

import { organizationSchema } from '@/lib/db/schemas/organization'
import { handleGetOrganization, handleUpdateOrganization, handleDeleteOrganization } from '@/lib/db/handlers/organization-handlers'
import { toNextResponse } from '@/lib/api-handlers'

// =============
//      GET
// =============
export const GET = async (
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) => {
  const organizationId = (await params)?.id
  const result = await handleGetOrganization(organizationId)
  return toNextResponse(result)
}

// =============
//      PUT
// =============
export const PUT = async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) => {
  const organizationId = (await params)?.id
  const payload = await req.json() as z.infer<typeof organizationSchema.api>

  const result = await handleUpdateOrganization(organizationId, payload)
  return toNextResponse(result)
}

// ==============
//     DELETE
// ==============
export const DELETE = async (
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) => {
  const organizationId = (await params)?.id
  
  const result = await handleDeleteOrganization(organizationId)
  return toNextResponse(result)
}
