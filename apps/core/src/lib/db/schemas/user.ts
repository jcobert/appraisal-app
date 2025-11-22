import { z } from 'zod'

import { User } from '@repo/database'
import { ZodObject } from '@repo/types'

import {
  SchemaBundle,
  fieldBuilder,
  formErrorMap,
  sanitizedField,
} from '@/utils/zod'

import { TableMutable } from '@/types/db'

type SchemaBase = ZodObject<
  Omit<TableMutable<User>, 'accountId' | 'userRole' | 'avatar'>
>

const baseSchema = z.object(
  {
    firstName: sanitizedField.text({ type: 'name' }),
    lastName: sanitizedField.text({ type: 'name' }),
    email: sanitizedField.text({ type: 'email' }),
    phone: sanitizedField.text({ type: 'phone' }).optional(),
  } satisfies SchemaBase,
  { errorMap: formErrorMap },
)

const form = z.object(
  {
    // firstName is required with custom message
    firstName: fieldBuilder.text({
      type: 'name',
      label: 'First name',
      required: true,
    }),

    // lastName is optional with custom validation rules
    lastName: fieldBuilder.text({
      type: 'name',
      label: 'Last name',
      required: false,
      customRules: [
        {
          pattern: /^\s*$/,
          message: 'Last name cannot be only whitespace',
        },
      ],
    }),

    // Email with label and only dangerous content checking
    email: fieldBuilder.text({
      type: 'email',
      label: 'Email',
      required: true,
      ruleSet: 'dangerousOnly',
    }),

    // Phone that allows empty string or follows phone rules
    phone: fieldBuilder.text({ type: 'phone', required: false }),
  } satisfies SchemaBase,
  { errorMap: formErrorMap },
)

export const userProfileSchema = {
  form,
  api: baseSchema,
} satisfies SchemaBundle

export type UserProfileFormData = z.infer<typeof userProfileSchema.form>
