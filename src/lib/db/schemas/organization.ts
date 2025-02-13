import { Organization } from '@prisma/client'
import { z } from 'zod'

import { SchemaBundle, formErrorMap } from '@/utils/zod'

import { TableMutable } from '@/types/db'
import { ZodObject } from '@/types/general'

type SchemaBase = ZodObject<TableMutable<Organization>>

const baseSchema = z.object(
  {
    name: z.string().nonempty(),
    avatar: z.string().optional(),
  } satisfies SchemaBase,
  { errorMap: formErrorMap },
)

export const organizationSchema = {
  form: baseSchema,
  api: baseSchema,
} satisfies SchemaBundle

export type OrganizationFormData = z.infer<typeof organizationSchema.form>
