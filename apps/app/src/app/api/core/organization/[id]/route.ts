import { NextRequest } from 'next/server'

import { toNextResponse } from '@/lib/db/api-handlers'
import {
  handleDeleteOrganization,
  handleGetOrganization,
  handleUpdateOrganization,
} from '@/lib/db/handlers/organization-handlers'
import { OrganizationApiData } from '@/lib/db/schemas/organization'

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
  const payload = (await req.json()) as OrganizationApiData

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
