import { createApiHandler } from '@/lib/db/api-handlers'
import { db } from '@/lib/db/client'
import { ValidationError } from '@/lib/db/errors'
import { orderSchema } from '@/lib/db/schemas/order'

import { isValidationSuccess, validatePayload } from '@/utils/zod'

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

      const result = await db.order.create({
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
      messages: { success: 'Order created successfully' },
    },
  )
}

export type CreateOrderResult = Awaited<ReturnType<typeof handleCreateOrder>>
