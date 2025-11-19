import { NextRequest } from 'next/server'

import { toNextResponse } from '@/lib/db/api-handlers'
import {
  handleGetOrgMember,
  handleUpdateOrgMember,
} from '@/lib/db/handlers/organization-member-handlers'
import { MemberInviteApiSchema } from '@/lib/db/schemas/org-member'

export const GET = async (
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; memberId: string }> },
) => {
  const { id: organizationId, memberId } = await params
  const result = await handleGetOrgMember(organizationId, memberId)
  return toNextResponse(result)
}

export const PUT = async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string; memberId: string }> },
) => {
  const { id: organizationId, memberId } = await params
  const payload = (await req.json()) as MemberInviteApiSchema

  const result = await handleUpdateOrgMember(organizationId, memberId, payload)
  return toNextResponse(result)
}
