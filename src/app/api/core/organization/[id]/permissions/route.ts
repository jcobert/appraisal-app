import { NextRequest } from 'next/server'

import { toNextResponse } from '@/lib/db/api-handlers'
import { handleGetOrganizationPermissions } from '@/lib/db/handlers/organization-handlers'

export const GET = async (
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) => {
  const organizationId = (await params)?.id

  const result = await handleGetOrganizationPermissions(organizationId)
  return toNextResponse(result)
}
