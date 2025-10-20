import { z } from 'zod'

import { Organization } from '@repo/database'
import { ZodObject } from '@repo/types'

import {
  SchemaBundle,
  fieldBuilder,
  formErrorMap,
  sanitizedField,
} from '@/utils/zod'

import { TableMutable } from '@/types/db'

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
      label: 'Organization name',
      required: true,
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
export type OrganizationApiData = z.infer<typeof organizationSchema.api>
