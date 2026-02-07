import { createApiHandler } from '@/lib/db/api-handlers'
import { db } from '@/lib/db/client'
import { ValidationError } from '@/lib/db/errors'
import { orderSchema } from '@/lib/db/schemas/order'

import { isValidationSuccess, validatePayload } from '@/utils/zod'

export const handleCreateOrder = async (
  payload: Parameters<typeof db.order.create>[0]['data'],
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

      if (!userProfileId) {
        throw new ValidationError('No user profile found.', {})
      }

      const result = await db.order.create({
        data: {
          ...validation.data,
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
