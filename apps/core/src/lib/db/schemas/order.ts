import { z } from 'zod'

import {
  AppraisalType,
  Order,
  OrderStatus,
  PaymentStatus,
} from '@repo/database'
import { ZodObjectShape } from '@repo/types'

import { SchemaBundle, formErrorMap, sanitizedField } from '@/utils/zod'

import { TableMutable } from '@/types/db'

type SchemaBase = ZodObjectShape<TableMutable<Omit<Order, 'organizationId'>>>

const apiSchema = z.object(
  {
    // organizationId: sanitizedField.text({ type: 'uuid' }),
    clientId: sanitizedField.text({ type: 'uuid' }).nullable(),
    appraiserId: sanitizedField.text({ type: 'uuid' }).nullable(),
    borrowerId: sanitizedField.text({ type: 'uuid' }).nullable(),
    propertyId: sanitizedField.text({ type: 'uuid' }).nullable(),

    dueDate: z.coerce.date().nullable(),
    orderDate: z.coerce.date().nullable(),
    inspectionDate: z.coerce.date().nullable(),

    appraisalType: z.nativeEnum(AppraisalType).nullable(),
    orderStatus: z.nativeEnum(OrderStatus),
    paymentStatus: z.nativeEnum(PaymentStatus),

    fileNumber: z.string().max(100).nullable(),
    baseFee: z.number().min(0).max(Number.MAX_SAFE_INTEGER).nullable(),
    techFee: z.number().min(0).max(Number.MAX_SAFE_INTEGER).nullable(),
    questionnaireFee: z.number().min(0).max(Number.MAX_SAFE_INTEGER).nullable(),
    questionnaire: z.boolean(),
    contract: z.boolean(),
    sent: z.boolean(),
  } satisfies SchemaBase,
  { errorMap: formErrorMap },
)

const formSchema = z.object(
  {
    // organizationId: z.string(),
    clientId: z.string().nullable(),
    appraiserId: z.string().nullable(),
    borrowerId: z.string().nullable(),
    propertyId: z.string().nullable(),

    dueDate: z.date().nullable(),
    orderDate: z.date().nullable(),
    inspectionDate: z.date().nullable(),

    appraisalType: z.nativeEnum(AppraisalType).nullable(),
    orderStatus: z.nativeEnum(OrderStatus).nullable(),
    paymentStatus: z.nativeEnum(PaymentStatus).nullable(),

    fileNumber: z.string().max(100),
    baseFee: z.number().min(0).max(Number.MAX_SAFE_INTEGER).nullable(),
    techFee: z.number().min(0).max(Number.MAX_SAFE_INTEGER).nullable(),
    questionnaireFee: z.number().min(0).max(Number.MAX_SAFE_INTEGER).nullable(),
    questionnaire: z.boolean(),
    contract: z.boolean(),
    sent: z.boolean(),
  } satisfies SchemaBase,
  { errorMap: formErrorMap },
)

export const orderSchema = {
  form: formSchema,
  api: apiSchema,
} satisfies SchemaBundle

export type OrderFormData = z.infer<typeof orderSchema.form>
export type OrderApiData = z.infer<typeof orderSchema.api>
