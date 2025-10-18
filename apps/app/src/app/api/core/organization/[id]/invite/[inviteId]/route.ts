import { NextRequest } from 'next/server'

import { toNextResponse } from '@/lib/db/api-handlers'
import {
  handleDeleteOrgInvite,
  handleUpdateOrgInvite,
} from '@/lib/db/handlers/organization-invite-handlers'

import { OrgInvitePayload } from '@/features/organization/hooks/use-organization-invite'

export const DELETE = async (
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; inviteId: string }> },
) => {
  const { id: organizationId, inviteId } = await params
  const result = await handleDeleteOrgInvite(organizationId, inviteId)
  return toNextResponse(result)
}

export const PUT = async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string; inviteId: string }> },
) => {
  const { id: organizationId, inviteId } = await params
  const payload = (await req.json()) as OrgInvitePayload

  const result = await handleUpdateOrgInvite(organizationId, inviteId, payload)
  return toNextResponse(result)
}
