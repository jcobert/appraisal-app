import { z } from 'zod'

import {
  AppraisalType,
  Order,
  OrderStatus,
  PaymentStatus,
  Property,
  PropertyType,
} from '@repo/database'
import { NullableZodObjectShape, ZodObjectShape } from '@repo/types'

import {
  SchemaBundle,
  fieldBuilder,
  formErrorMap,
  sanitizedField,
} from '@/utils/zod'

import { TableMutable } from '@/types/db'

type OrderFields = TableMutable<Omit<Order, 'organizationId'>>

type PropertyFields = TableMutable<Omit<Property, 'id'>>

type ApiSchemaBase = ZodObjectShape<OrderFields & PropertyFields>

type FormSchemaBase = NullableZodObjectShape<OrderFields & PropertyFields>

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
    clientOrderNum: z.string().max(100).nullable(),
    baseFee: z.number().min(0).max(Number.MAX_SAFE_INTEGER).nullable(),
    techFee: z.number().min(0).max(Number.MAX_SAFE_INTEGER).nullable(),
    questionnaireFee: z.number().min(0).max(Number.MAX_SAFE_INTEGER).nullable(),
    questionnaire: z.boolean(),
    contract: z.boolean(),
    sent: z.boolean(),

    propertyType: z.nativeEnum(PropertyType),
    street: sanitizedField.text({ type: 'general' }),
    street2: sanitizedField.text({ type: 'general' }).nullable(),
    city: sanitizedField.text({ type: 'general' }),
    state: sanitizedField.text({ type: 'general' }),
    zip: sanitizedField.text({ type: 'general' }),
  } satisfies ApiSchemaBase,
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
    clientOrderNum: z.string().max(100),
    baseFee: z.number().min(0).max(Number.MAX_SAFE_INTEGER).nullable(),
    techFee: z.number().min(0).max(Number.MAX_SAFE_INTEGER).nullable(),
    questionnaireFee: z.number().min(0).max(Number.MAX_SAFE_INTEGER).nullable(),
    questionnaire: z.boolean(),
    contract: z.boolean(),
    sent: z.boolean(),

    propertyType: z.nativeEnum(PropertyType),
    street: fieldBuilder.text({ label: 'Address', required: true }),
    street2: fieldBuilder.text({ label: 'Address 2' }),
    city: fieldBuilder.text({ label: 'City', required: true }),
    state: fieldBuilder.text({ label: 'State', required: true }),
    zip: fieldBuilder.text({ label: 'ZIP', required: true }),
  } satisfies FormSchemaBase,
  { errorMap: formErrorMap },
)

export const orderSchema = {
  form: formSchema,
  api: apiSchema,
} satisfies SchemaBundle

export type OrderFormData = z.infer<typeof orderSchema.form>
export type OrderApiData = z.infer<typeof orderSchema.api>
