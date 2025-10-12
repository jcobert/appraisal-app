import { NextRequest } from 'next/server'

import { toNextResponse } from '@/lib/db/api-handlers'
import {
  handleCreateOrganization,
  handleGetUserOrganizations,
} from '@/lib/db/handlers/organization-handlers'
import { OrganizationApiData } from '@/lib/db/schemas/organization'

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
  const payload = (await req.json()) as OrganizationApiData

  const result = await handleCreateOrganization(payload)
  return toNextResponse(result)
}
