import { MemberRole, OrgInvitationStatus } from '@prisma/client'
import { z } from 'zod'

import {
  SchemaBundle,
  fieldBuilder,
  formErrorMap,
  sanitizedField,
} from '@/utils/zod'

/**
 * Form schema for member invitation forms with enhanced validation messages.
 */
const formSchema = z.object(
  {
    firstName: fieldBuilder.name({
      requiredMessage: 'First name is required',
    }),
    lastName: fieldBuilder.name({
      requiredMessage: 'Last name is required',
    }),
    email: fieldBuilder.email({
      emailMessage: 'Please provide a valid email address',
      ruleSet: 'dangerousOnly',
    }),
    roles: z.array(z.nativeEnum(MemberRole)).min(1, 'Select at least one role'),
  },
  { errorMap: formErrorMap },
)

/**
 * API payload schema for member invitation creation and updates with sanitized fields.
 */
const apiSchema = z.object({
  firstName: sanitizedField.name(),
  lastName: sanitizedField.name(),
  email: sanitizedField.email(),
  roles: z
    .array(z.nativeEnum(MemberRole))
    .min(1, 'At least one role is required'),
})

/**
 * Schema for invitation token operations (join and public invite retrieval).
 */
const inviteTokenSchema = z.object(
  {
    organizationId: z.string().min(1, 'Organization ID is required'),
    token: z.string().min(1, 'Token is required'),
    status: z.nativeEnum(OrgInvitationStatus).optional(),
  },
  { errorMap: formErrorMap },
)

export const orgMemberSchema = {
  form: formSchema,
  api: apiSchema,
  inviteToken: inviteTokenSchema,
} satisfies SchemaBundle & {
  /** Specialized schema for invitation token operations */
  inviteToken: z.ZodSchema
}

export type MemberInviteFormData = z.infer<typeof orgMemberSchema.form>
export type MemberInviteApiData = z.infer<typeof orgMemberSchema.api>
export type InviteTokenData = z.infer<typeof orgMemberSchema.inviteToken>
