import { NextRequest } from 'next/server'

import { toNextResponse } from '@/lib/db/api-handlers'
import { handleTransferOwnership } from '@/lib/db/handlers/organization-member-handlers'
import { TransferOwnershipSchema } from '@/lib/db/schemas/org-member'

export const POST = async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) => {
  const { id: organizationId } = await params
  const payload = (await req.json()) as TransferOwnershipSchema
  const result = await handleTransferOwnership(organizationId, payload)
  return toNextResponse(result)
}
