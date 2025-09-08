import { NextRequest } from 'next/server'

import { toNextResponse } from '@/lib/db/api-handlers'
import { handleCreateUser } from '@/lib/db/handlers/user-handlers'

// ==============
//      POST
// ==============
export const POST = async (req: NextRequest) => {
  const payload = (await req.json()) as Parameters<typeof handleCreateUser>[0]

  const result = await handleCreateUser(payload)
  return toNextResponse(result)
}
