import { NextRequest } from 'next/server'

import { toNextResponse } from '@/lib/db/api-handlers'
import { handleRegisterUser } from '@/lib/db/handlers/user-handlers'

// ==============
//      POST
// ==============
export const POST = async (_req: NextRequest) => {
  const result = await handleRegisterUser()
  return toNextResponse(result)
}
