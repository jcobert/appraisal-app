import { NextRequest } from 'next/server'

import { toNextResponse } from '@/lib/api-handlers'
import {
  handleCreateUser,
  handleGetUsers,
} from '@/lib/db/handlers/user-handlers'

// =============
//      GET
// =============
export const GET = async (_req: NextRequest) => {
  const result = await handleGetUsers()
  return toNextResponse(result)
}

// ==============
//      POST
// ==============
export const POST = async (req: NextRequest) => {
  const payload = (await req.json()) as Parameters<typeof handleCreateUser>[0]

  const result = await handleCreateUser(payload)
  return toNextResponse(result)
}
