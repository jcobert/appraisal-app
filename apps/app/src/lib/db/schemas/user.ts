import { User } from '@prisma/client'
import { z } from 'zod'

import {
  SchemaBundle,
  fieldBuilder,
  formErrorMap,
  sanitizedField,
} from '@/utils/zod'

import { TableMutable } from '@/types/db'
import { ZodObject } from '@/types/general'

type SchemaBase = ZodObject<
  Omit<TableMutable<User>, 'accountId' | 'userRole' | 'avatar'>
>

const baseSchema = z.object(
  {
    firstName: sanitizedField.name(),
    lastName: sanitizedField.name(),
    email: sanitizedField.email(),
    phone: sanitizedField.phone().optional(),
  } satisfies SchemaBase,
  { errorMap: formErrorMap },
)

const form = z.object(
  {
    // firstName is required with custom message
    firstName: fieldBuilder.name({
      label: 'First name',
    }),

    // lastName is optional with custom validation rules
    lastName: fieldBuilder.name({
      label: 'Last name',
      required: false,
      customRules: [
        {
          id: 'invalidNameChars',
          pattern: /^\s*$/,
          message: 'Last name cannot be only whitespace',
        },
      ],
    }),

    // Email with label and only dangerous content checking
    email: fieldBuilder.email({
      label: 'Email',
      ruleSet: 'dangerousOnly',
    }),

    // Phone that allows empty string or follows phone rules
    phone: fieldBuilder.phone({ required: false }).or(z.literal('')),
  } satisfies SchemaBase,
  { errorMap: formErrorMap },
)

export const userProfileSchema = {
  form,
  api: baseSchema,
} satisfies SchemaBundle

export type UserProfileFormData = z.infer<typeof userProfileSchema.form>
