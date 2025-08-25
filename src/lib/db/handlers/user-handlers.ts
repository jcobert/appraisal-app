// sort-imports-ignore
import 'server-only'

import { db } from '@/lib/db/client'
import { getActiveUserProfile } from '@/lib/db/queries/user'

import { createApiHandler } from '@/lib/api-handlers'

/**
 * Get all users
 * Can be used in both API routes and server components
 */
export async function handleGetUsers() {
  return createApiHandler(async () => {
    const users = await db.user.findMany()
    return users
  })
}

/**
 * Get active user profile
 * Can be used in both API routes and server components
 */
export async function handleGetActiveUser() {
  return createApiHandler(async () => {
    const user = await getActiveUserProfile()
    return user
  })
}

/**
 * Get user by ID
 * Can be used in both API routes and server components
 */
export async function handleGetUser(userId: string) {
  return createApiHandler(async () => {
    if (!userId) {
      throw new Error('User ID is required')
    }
    
    const user = await db.user.findUnique({
      where: { id: userId }
    })
    return user
  })
}

// Export types for the handlers
export type GetUsersResult = Awaited<ReturnType<typeof handleGetUsers>>
export type GetActiveUserResult = Awaited<ReturnType<typeof handleGetActiveUser>>
export type GetUserResult = Awaited<ReturnType<typeof handleGetUser>>
