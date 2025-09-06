import { NextRequest } from 'next/server'

import { toNextResponse } from '@/lib/db/api-handlers'
import { handleCreateOrgInvite } from '@/lib/db/handlers/organization-invite-handlers'

import { OrgInvitePayload } from '@/features/organization/hooks/use-organization-invite'

export const POST = async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) => {
  const organizationId = (await params)?.id
  const payload = (await req.json()) as OrgInvitePayload

  const result = await handleCreateOrgInvite(organizationId, payload)
  return toNextResponse(result)
}
