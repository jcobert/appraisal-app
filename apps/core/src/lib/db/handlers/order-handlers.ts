import { createApiHandler } from '@/lib/db/api-handlers'
import { db } from '@/lib/db/client'
import { ValidationError } from '@/lib/db/errors'
import { orderSchema } from '@/lib/db/schemas/order'

import { isValidationSuccess, validatePayload } from '@/utils/zod'

export const handleGetOrders = async (organizationId: string) => {
  return createApiHandler(async () => {
    // Simple check for required route parameter
    if (!organizationId) {
      throw new ValidationError('Organization ID is required.', {})
    }

    const result = await db.order.findMany({
      where: { organizationId },
      include: {
        property: {
          select: {
            propertyType: true,
            street: true,
            street2: true,
            city: true,
            state: true,
            zip: true,
          },
        },
        client: { select: { name: true, logo: true } },
        appraiser: {
          select: {
            user: { select: { firstName: true, lastName: true, avatar: true } },
          },
        },
      },
    })

    return result
  })
}
export const handleGetOrder = async (
  organizationId: string,
  orderId: string,
) => {
  return createApiHandler(async () => {
    // Simple check for required route parameters
    if (!organizationId) {
      throw new ValidationError('Organization ID is required.', {})
    }
    if (!orderId) {
      throw new ValidationError('Order ID is required.', {})
    }

    const result = await db.order.findUnique({
      where: { id: orderId, organizationId },
      include: {
        property: true,
        client: { select: { name: true, logo: true } },
        appraiser: {
          select: {
            user: { select: { firstName: true, lastName: true, avatar: true } },
          },
        },
      },
    })

    return result
  })
}

export const handleCreateOrder = async (
  organizationId: string,
  payload: Omit<
    Parameters<typeof db.order.create>[0]['data'],
    'organizationId'
  >,
) => {
  return createApiHandler(
    async ({ userProfileId }) => {
      const validation = validatePayload(orderSchema.api, payload)

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

      // Extract property fields from validated data
      const {
        propertyId,
        propertyType,
        street,
        street2,
        city,
        state,
        zip,
        ...orderData
      } = validation.data

      // Create property if not connecting to existing one
      let finalPropertyId = propertyId

      if (!finalPropertyId) {
        const property = await db.property.create({
          data: {
            propertyType,
            street,
            street2,
            city,
            state,
            zip,
            createdBy: userProfileId,
            updatedBy: userProfileId,
          },
          select: { id: true },
        })
        finalPropertyId = property.id
      }

      const result = await db.order.create({
        data: {
          ...orderData,
          propertyId: finalPropertyId,
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
      messages: { success: 'Order created successfully' },
    },
  )
}

export type CreateOrderResult = Awaited<ReturnType<typeof handleCreateOrder>>
export type GetOrdersResult = Awaited<ReturnType<typeof handleGetOrders>>
export type GetOrderResult = Awaited<ReturnType<typeof handleGetOrder>>
