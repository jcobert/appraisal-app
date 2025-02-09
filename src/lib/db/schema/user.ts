import { User } from '@prisma/client'
import { z } from 'zod'

import { SchemaBundle, formErrorMap } from '@/utils/zod'

import { TableMutable } from '@/types/db'
import { ZodObject } from '@/types/general'

const baseSchema = z.object(
  {
    firstName: z.string().nonempty(),
    lastName: z.string().nonempty(),
    email: z.string().email().nonempty(),
    phone: z.string().optional(),
  } satisfies ZodObject<
    Omit<TableMutable<User>, 'accountId' | 'userRole' | 'avatar'>
  >,
  { errorMap: formErrorMap },
)

const form = baseSchema.extend({
  phone: baseSchema.shape.phone.or(z.literal('')),
})

export const userProfileSchema = {
  form,
  api: baseSchema,
} satisfies SchemaBundle
