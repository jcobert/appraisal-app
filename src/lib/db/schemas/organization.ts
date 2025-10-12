import { Organization } from '@prisma/client'
import { z } from 'zod'

import {
  SchemaBundle,
  fieldBuilder,
  formErrorMap,
  sanitizedField,
} from '@/utils/zod'

import { TableMutable } from '@/types/db'
import { ZodObject } from '@/types/general'

type SchemaBase = ZodObject<TableMutable<Organization>>

const baseSchema = z.object(
  {
    name: sanitizedField.name(),
    avatar: z.string().optional(),
  } satisfies SchemaBase,
  { errorMap: formErrorMap },
)

const form = z.object(
  {
    name: fieldBuilder.name({
      required: true,
      requiredMessage: 'Organization name is required',
    }),
    avatar: z.string().optional(),
  } satisfies SchemaBase,
  { errorMap: formErrorMap },
)

export const organizationSchema = {
  form,
  api: baseSchema,
} satisfies SchemaBundle

export type OrganizationFormData = z.infer<typeof organizationSchema.form>
