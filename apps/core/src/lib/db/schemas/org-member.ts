import { z } from 'zod'

import { MemberRole, OrgInvitationStatus } from '@repo/database'

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
      label: 'First name',
    }),
    lastName: fieldBuilder.name({
      label: 'Last name',
    }),
    email: fieldBuilder.email({
      label: 'Email',
      required: true,
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
  active: z.boolean().optional(),
  isOwner: z.boolean().optional(),
})

/**
 * Schema for invitation token operations (join and public invite retrieval).
 * UUIDs/tokens are sanitized for defense-in-depth security.
 * Used server-side to clean query parameters before database lookup.
 */
const inviteTokenSchema = z.object(
  {
    organizationId: sanitizedField.uuid(),
    token: sanitizedField.uuid(),
    status: z.nativeEnum(OrgInvitationStatus).optional(),
  },
  { errorMap: formErrorMap },
)

/**
 * Schema for transferring organization ownership.
 * Requires the new owner's member ID and optionally whether to keep admin role.
 */
const transferOwnershipSchema = z.object(
  {
    newOwnerMemberId: sanitizedField.uuid(),
    keepAdminRole: z.boolean().optional(),
  },
  { errorMap: formErrorMap },
)

export const orgMemberSchema = {
  form: formSchema,
  api: apiSchema,
  inviteToken: inviteTokenSchema,
  transferOwnership: transferOwnershipSchema,
} satisfies SchemaBundle & {
  /** Specialized schema for invitation token operations */
  inviteToken: z.ZodSchema
  /** Specialized schema for transferring ownership */
  transferOwnership: z.ZodSchema
}

export type MemberInviteFormSchema = z.infer<typeof orgMemberSchema.form>
export type MemberInviteApiSchema = z.infer<typeof orgMemberSchema.api>
export type InviteTokenSchema = z.infer<typeof orgMemberSchema.inviteToken>
export type TransferOwnershipSchema = z.infer<
  typeof orgMemberSchema.transferOwnership
>
