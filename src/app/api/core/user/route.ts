import { NextRequest } from 'next/server'

import { toNextResponse } from '@/lib/db/api-handlers'
import { handleCreateUserProfile } from '@/lib/db/handlers/user-handlers'

// ==============
//      POST
// ==============
export const POST = async (req: NextRequest) => {
  const payload = (await req.json()) as Parameters<typeof handleCreateUserProfile>[0]

  const result = await handleCreateUserProfile(payload)
  return toNextResponse(result)
}
