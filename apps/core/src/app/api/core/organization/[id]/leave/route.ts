import { NextRequest } from 'next/server'

import { toNextResponse } from '@/lib/db/api-handlers'
import { handleLeaveOrganization } from '@/lib/db/handlers/organization-member-handlers'

export const POST = async (
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) => {
  const { id: organizationId } = await params
  const result = await handleLeaveOrganization(organizationId)
  return toNextResponse(result)
}
