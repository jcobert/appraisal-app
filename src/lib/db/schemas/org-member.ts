import { OrgMember } from '@prisma/client'
import { z } from 'zod'

import { SchemaBundle, formErrorMap } from '@/utils/zod'

import { TableMutable } from '@/types/db'
import { ZodObject } from '@/types/general'

import { ORG_MEMBER_ROLES } from '@/features/organization/utils'

type SchemaBase = ZodObject<TableMutable<OrgMember>>

const formSchema = z.object(
  {
    firstName: z.string().nonempty(),
    lastName: z.string().nonempty(),
    email: z.string().email(),
    roles: z.array(z.enum(ORG_MEMBER_ROLES)).min(1, 'Select at least one role'),
  },
  { errorMap: formErrorMap },
)

const apiSchema = z.object(
  {
    active: z.boolean(),
    organizationId: z.string().nonempty(),
    roles: z.array(z.enum(ORG_MEMBER_ROLES)).min(1, 'Select at least one role'),
  } satisfies SchemaBase,
  { errorMap: formErrorMap },
)

// const form = baseSchema.extend({
//   phone: baseSchema.shape.phone.or(z.literal('')),
// } satisfies SchemaBase)

export const orgMemberSchema = {
  form: formSchema,
  api: apiSchema,
} satisfies SchemaBundle

export type MemberInviteFormData = z.infer<typeof orgMemberSchema.form>
