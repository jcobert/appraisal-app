import { createApiHandler } from '@/lib/db/api-handlers'
import { db } from '@/lib/db/client'
import { ValidationError } from '@/lib/db/errors'
import { clientSchema } from '@/lib/db/schemas/client'

import { isValidationSuccess, validatePayload } from '@/utils/zod'

export const handleGetClients = async (organizationId: string) => {
  return createApiHandler(async () => {
    // Simple check for required route parameter
    if (!organizationId) {
      throw new ValidationError('Organization ID is required.', {})
    }

    // Get all clients that belong to this organization
    const result = await db.client.findMany({
      where: {
        organizationId,
      },
      include: {
        _count: {
          select: { Order: true },
        },
      },
    })

    return result
  })
}

export const handleGetClient = async (
  organizationId: string,
  clientId: string,
) => {
  return createApiHandler(async () => {
    // Simple check for required route parameters
    if (!organizationId) {
      throw new ValidationError('Organization ID is required.', {})
    }
    if (!clientId) {
      throw new ValidationError('Client ID is required.', {})
    }

    const result = await db.client.findFirst({
      where: {
        id: clientId,
        organizationId,
      },
      include: {
        _count: {
          select: { Order: true },
        },
      },
    })

    return result
  })
}

export const handleCreateClient = async (
  organizationId: string,
  payload: Omit<
    Parameters<typeof db.client.create>[0]['data'],
    'organizationId' | 'organization'
  >,
) => {
  return createApiHandler(
    async ({ userProfileId }) => {
      const validation = validatePayload(clientSchema.api, payload)

      if (!isValidationSuccess(validation)) {
        throw new ValidationError(
          'Invalid data provided.',
          validation.errors || {},
        )
      }

      // Simple check for required route parameter
      if (!organizationId) {
        throw new ValidationError('Organization ID is required.', {})
      }

      if (!userProfileId) {
        throw new ValidationError('No user profile found.', {})
      }

      const result = await db.client.create({
        data: {
          ...validation.data,
          organizationId,
          createdBy: userProfileId,
          updatedBy: userProfileId,
        },
        select: { id: true },
      })

      return result
    },
    {
      isMutation: true,
      messages: { success: 'Client created successfully' },
    },
  )
}

export const handleUpdateClient = async (
  organizationId: string,
  clientId: string,
  payload: Partial<
    Omit<
      Parameters<typeof db.client.update>[0]['data'],
      'organizationId' | 'organization'
    >
  >,
) => {
  return createApiHandler(
    async ({ userProfileId }) => {
      const validation = validatePayload(clientSchema.api.partial(), payload)

      if (!isValidationSuccess(validation)) {
        throw new ValidationError(
          'Invalid data provided.',
          validation.errors || {},
        )
      }

      // Simple check for required route parameters
      if (!organizationId) {
        throw new ValidationError('Organization ID is required.', {})
      }
      if (!clientId) {
        throw new ValidationError('Client ID is required.', {})
      }

      if (!userProfileId) {
        throw new ValidationError('No user profile found.', {})
      }

      // Verify the client belongs to this organization
      const existingClient = await db.client.findFirst({
        where: {
          id: clientId,
          organizationId,
        },
      })

      if (!existingClient) {
        throw new ValidationError(
          'Client not found or does not belong to this organization.',
          {},
        )
      }

      const result = await db.client.update({
        where: { id: clientId },
        data: {
          ...validation.data,
          updatedBy: userProfileId,
        },
        select: { id: true },
      })

      return result
    },
    {
      isMutation: true,
      messages: { success: 'Client updated successfully' },
    },
  )
}

export type CreateClientResult = Awaited<ReturnType<typeof handleCreateClient>>
export type UpdateClientResult = Awaited<ReturnType<typeof handleUpdateClient>>
export type GetClientsResult = Awaited<ReturnType<typeof handleGetClients>>
export type GetClientResult = Awaited<ReturnType<typeof handleGetClient>>
