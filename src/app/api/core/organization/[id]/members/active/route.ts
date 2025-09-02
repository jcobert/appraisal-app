import { NextRequest } from 'next/server'
import { z } from 'zod'

import { toNextResponse } from '@/lib/db/api-handlers'
import {
  handleGetActiveUserOrgMember,
  handleUpdateActiveUserOrgMember,
} from '@/lib/db/handlers/organization-member-handlers'
import { orgMemberSchema } from '@/lib/db/schemas/org-member'

export const GET = async (
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) => {
  const { id: organizationId } = await params
  const result = await handleGetActiveUserOrgMember(organizationId)
  return toNextResponse(result)
}

export const PUT = async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) => {
  const { id: organizationId } = await params
  const payload = (await req.json()) as z.infer<typeof orgMemberSchema.api>

  const result = await handleUpdateActiveUserOrgMember(organizationId, payload)
  return toNextResponse(result)
}
