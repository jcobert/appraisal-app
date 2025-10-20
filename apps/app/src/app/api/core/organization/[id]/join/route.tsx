import { NextRequest } from 'next/server'

import { toNextResponse } from '@/lib/db/api-handlers'
import { handleJoinOrganization, OrgJoinPayload } from '@/lib/db/handlers/organization-join-handlers'

export const POST = async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) => {
  const organizationId = (await params)?.id
  const payload = (await req.json()) as OrgJoinPayload

  const result = await handleJoinOrganization(organizationId, payload)
  return toNextResponse(result)
}
