import { NextRequest } from 'next/server'

import { toNextResponse } from '@/lib/db/api-handlers'
import { handleGetUserProfile } from '@/lib/db/handlers/user-handlers'

// =============
//      GET
// =============
export const GET = async (
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) => {
  const userId = (await params)?.id
  const result = await handleGetUserProfile(userId)
  return toNextResponse(result)
}
