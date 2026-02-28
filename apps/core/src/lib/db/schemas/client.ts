import { z } from 'zod'

import { Client } from '@repo/database'
import { NullableZodObjectShape, ZodObjectShape } from '@repo/types'

import {
  SchemaBundle,
  fieldBuilder,
  formErrorMap,
  sanitizedField,
} from '@/utils/zod'

import { TableMutable } from '@/types/db'

type ClientFields = TableMutable<Client>

type ApiSchemaBase = ZodObjectShape<ClientFields>

type FormSchemaBase = NullableZodObjectShape<ClientFields>

const apiSchema = z.object(
  {
    name: sanitizedField.text({ type: 'general' }),
    phone: sanitizedField.text({ type: 'general' }).nullable(),
    email: sanitizedField.text({ type: 'email' }).nullable(),
    street: sanitizedField.text({ type: 'general' }).nullable(),
    street2: sanitizedField.text({ type: 'general' }).nullable(),
    city: sanitizedField.text({ type: 'general' }).nullable(),
    state: sanitizedField.text({ type: 'general' }).nullable(),
    zip: sanitizedField.text({ type: 'general' }).nullable(),
    website: sanitizedField.text({ type: 'general' }).nullable(),
    logo: sanitizedField.text({ type: 'general' }).nullable(),
    poc: sanitizedField.text({ type: 'general' }).nullable(),
    note: sanitizedField.text({ type: 'general' }).nullable(),
    favorite: z.boolean().nullable(),
  } satisfies ApiSchemaBase,
  { errorMap: formErrorMap },
)

const formSchema = z.object(
  {
    name: fieldBuilder.text({ label: 'Name', required: true }),
    phone: fieldBuilder.text({ label: 'Phone' }),
    email: fieldBuilder.text({ type: 'email', label: 'Email' }),
    street: fieldBuilder.text({ label: 'Address' }),
    street2: fieldBuilder.text({ label: 'Address 2' }),
    city: fieldBuilder.text({ label: 'City' }),
    state: fieldBuilder.text({ label: 'State' }),
    zip: fieldBuilder.text({ label: 'ZIP' }),
    website: fieldBuilder.text({ label: 'Website' }),
    logo: z.string().nullable(),
    poc: fieldBuilder.text({ label: 'Point of Contact' }),
    note: fieldBuilder.text({ label: 'Notes' }),
    favorite: z.boolean().nullable(),
  } satisfies FormSchemaBase,
  { errorMap: formErrorMap },
)

export const clientSchema = {
  form: formSchema,
  api: apiSchema,
} satisfies SchemaBundle

export type ClientFormData = z.infer<typeof clientSchema.form>
export type ClientApiData = z.infer<typeof clientSchema.api>
