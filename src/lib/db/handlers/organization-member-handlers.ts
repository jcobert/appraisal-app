// sort-imports-ignore
import 'server-only'

import {
  getOrgMember,
  getActiveUserOrgMember,
} from '@/lib/db/queries/organization'

import { createApiHandler } from '@/lib/api-handlers'

/**
 * Get a specific organization member by ID
 * Can be used in both API routes and server components
 */
export async function handleGetOrgMember(organizationId: string, memberId: string) {
  return createApiHandler(async () => {
    if (!organizationId) {
      throw new Error('Organization ID is required')
    }
    if (!memberId) {
      throw new Error('Member ID is required')
    }
    
    const member = await getOrgMember({ organizationId, memberId })
    return member
  })
}

/**
 * Get the active user's organization member data
 * Can be used in both API routes and server components
 */
export async function handleGetActiveUserOrgMember(organizationId: string) {
  return createApiHandler(async () => {
    if (!organizationId) {
      throw new Error('Organization ID is required')
    }
    
    const member = await getActiveUserOrgMember({ organizationId })
    return member
  })
}

// Export types for the handlers
export type GetOrgMemberResult = Awaited<ReturnType<typeof handleGetOrgMember>>
export type GetActiveUserOrgMemberResult = Awaited<ReturnType<typeof handleGetActiveUserOrgMember>>
