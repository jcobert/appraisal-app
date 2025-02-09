import { User } from '@prisma/client'
import { z } from 'zod'

import { TableMutable } from '@/types/db'
import { ZodObject } from '@/types/general'

export const userProfileSchema = z.object({
  firstName: z.string().nonempty(),
  lastName: z.string().nonempty(),
  email: z.string().email().nonempty(),
  phone: z.string().optional().or(z.literal('')),
} satisfies ZodObject<
  Omit<TableMutable<User>, 'accountId' | 'userRole' | 'avatar'>
>)
