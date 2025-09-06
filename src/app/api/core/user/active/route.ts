import { User } from '@prisma/client'
import { NextRequest } from 'next/server'

import { toNextResponse } from '@/lib/db/api-handlers'
import {
  handleGetActiveUser,
  handleUpdateActiveUser,
} from '@/lib/db/handlers/user-handlers'

// =============
//      GET
// =============
export const GET = async (_req: NextRequest) => {
  const result = await handleGetActiveUser()
  return toNextResponse(result)
}

// =============
//      PUT
// =============
export const PUT = async (req: NextRequest) => {
  const payload = (await req.json()) as User

  const result = await handleUpdateActiveUser(payload)
  return toNextResponse(result)
}
