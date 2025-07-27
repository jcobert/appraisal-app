import { User } from '@prisma/client'
import { z } from 'zod'

import { SchemaBundle, formErrorMap } from '@/utils/zod'

import { TableMutable } from '@/types/db'
import { ZodObject } from '@/types/general'

type SchemaBase = ZodObject<
  Omit<TableMutable<User>, 'accountId' | 'userRole' | 'avatar'>
>

const baseSchema = z.object(
  {
    firstName: z.string().trim().nonempty(),
    lastName: z.string().trim().nonempty(),
    email: z.string().trim().email().nonempty(),
    phone: z.string().trim().optional(),
  } satisfies SchemaBase,
  { errorMap: formErrorMap },
)

const form = baseSchema.extend({
  phone: baseSchema.shape.phone.or(z.literal('')),
} satisfies SchemaBase)

export const userProfileSchema = {
  form,
  api: baseSchema,
} satisfies SchemaBundle

export type UserProfileFormData = z.infer<typeof userProfileSchema.form>
