import { Appraiser } from '@prisma/client'
import { z } from 'zod'

import { SchemaBundle, formErrorMap } from '@/utils/zod'

import { TableMutable } from '@/types/db'
import { ZodObject } from '@/types/general'

type SchemaBase = ZodObject<TableMutable<Appraiser>>

const baseSchema = z.object(
  {
    firstName: z.string().nonempty(),
    lastName: z.string().nonempty(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
  } satisfies SchemaBase,
  { errorMap: formErrorMap },
)

const form = baseSchema.extend({
  email: baseSchema.shape.email.or(z.literal('')),
  phone: baseSchema.shape.phone.or(z.literal('')),
} satisfies SchemaBase)

export const appraiserSchema = {
  form,
  api: baseSchema,
} satisfies SchemaBundle

export type AppraiserFormData = z.infer<typeof appraiserSchema.form>
