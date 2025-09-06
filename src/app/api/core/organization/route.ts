import { NextRequest } from 'next/server'
import { z } from 'zod'

import { toNextResponse } from '@/lib/db/api-handlers'
import {
  handleCreateOrganization,
  handleGetUserOrganizations,
} from '@/lib/db/handlers/organization-handlers'
import { organizationSchema } from '@/lib/db/schemas/organization'

// =============
//      GET
// =============
export const GET = async (_req: NextRequest) => {
  const result = await handleGetUserOrganizations()
  return toNextResponse(result)
}

// ==============
//      POST
// ==============
export const POST = async (req: NextRequest) => {
  const payload = (await req.json()) as z.infer<typeof organizationSchema.api>

  const result = await handleCreateOrganization(payload)
  return toNextResponse(result)
}
