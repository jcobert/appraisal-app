import { NextRequest } from 'next/server'
import { z } from 'zod'

import { handleGetOrgMember, handleUpdateOrgMember, handleDeleteOrgMember } from '@/lib/db/handlers/organization-member-handlers'
import { orgMemberSchema } from '@/lib/db/schemas/org-member'
import { toNextResponse } from '@/lib/api-handlers'

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
  const payload = await req.json() as z.infer<typeof orgMemberSchema.api>

  const result = await handleUpdateOrgMember(organizationId, memberId, payload)
  return toNextResponse(result)
}

export const DELETE = async (
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; memberId: string }> },
) => {
  const { id: organizationId, memberId } = await params
  const result = await handleDeleteOrgMember(organizationId, memberId)
  return toNextResponse(result)
}
