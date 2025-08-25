// sort-imports-ignore
import 'server-only'

import {
  getOrganization,
  getUserOrganizations,
  updateOrganization,
  deleteOrganization,
  userIsOwner,
} from '@/lib/db/queries/organization'
import { getUserPermissions } from '@/lib/db/utils'

import { createApiHandler } from '@/lib/api-handlers'

/**
 * Get organizations for the current user
 * Can be used in both API routes and server components
 */
export async function handleGetUserOrganizations() {
  return createApiHandler(async () => {
    const organizations = await getUserOrganizations()
    return organizations || []
  })
}

/**
 * Get a single organization by ID
 * Can be used in both API routes and server components
 */
export async function handleGetOrganization(organizationId: string) {
  return createApiHandler(async () => {
    if (!organizationId) {
      throw new Error('Organization ID is required')
    }
    
    const organization = await getOrganization({ organizationId })
    return organization
  })
}

/**
 * Update an organization (requires owner permissions)
 * Can be used in both API routes and server components
 */
export async function handleUpdateOrganization(
  organizationId: string,
  payload: Parameters<typeof updateOrganization>[0]['payload']
) {
  return createApiHandler(
    async () => {
      if (!organizationId) {
        throw new Error('Organization ID is required')
      }

      const result = await updateOrganization({
        organizationId,
        payload,
      })
      return result
    },
    {
      authorizationCheck: async () => {
        const isOwner = await userIsOwner({ organizationId })
        return isOwner
      },
      messages: {
        unauthorized: 'Unauthorized to update this organization.',
        success: 'Organization updated successfully.',
      },
      isMutation: true,
    }
  )
}

/**
 * Delete an organization (requires owner permissions)
 * Can be used in both API routes and server components
 */
export async function handleDeleteOrganization(organizationId: string) {
  return createApiHandler(
    async () => {
      if (!organizationId) {
        throw new Error('Organization ID is required')
      }

      const result = await deleteOrganization({ organizationId })
      return result
    },
    {
      authorizationCheck: async () => {
        const isOwner = await userIsOwner({ organizationId })
        return isOwner
      },
      messages: {
        unauthorized: 'Unauthorized to delete this organization.',
        success: 'Organization deleted successfully.',
      },
      isMutation: true,
    }
  )
}

/**
 * Get user permissions for an organization
 * Can be used in both API routes and server components
 */
export async function handleGetOrganizationPermissions(organizationId: string) {
  return createApiHandler(async () => {
    if (!organizationId) {
      throw new Error('Organization ID is required')
    }
    
    const permissions = await getUserPermissions(organizationId)
    return permissions
  })
}

// Export types for the handlers
export type GetUserOrganizationsResult = Awaited<ReturnType<typeof handleGetUserOrganizations>>
export type GetOrganizationResult = Awaited<ReturnType<typeof handleGetOrganization>>
export type UpdateOrganizationResult = Awaited<ReturnType<typeof handleUpdateOrganization>>
export type DeleteOrganizationResult = Awaited<ReturnType<typeof handleDeleteOrganization>>
export type GetOrganizationPermissionsResult = Awaited<ReturnType<typeof handleGetOrganizationPermissions>>
