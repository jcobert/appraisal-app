// sort-imports-ignore
import 'server-only'

import { Organization } from '@prisma/client'

import { db } from '@/lib/db/client'
import { CanQueryOptions } from '@/lib/db/utils'

import { getActiveUserAccount } from '@/utils/auth'
import { KindeUser } from '@kinde-oss/kinde-auth-nextjs'

export const userIsMember = async (params: {
  organizationId: Organization['id']
  userId?: KindeUser['id']
}) => {
  const { organizationId, userId } = params || {}
  const accountId = userId || (await getActiveUserAccount())?.id
  if (!accountId) return false
  const data = await db.organization.findUnique({
    where: {
      id: organizationId,
      members: { some: { user: { accountId } } },
    },
    select: { id: true },
  })
  return !!data?.id
}

export const userIsOwner = async (params: {
  organizationId: Organization['id']
  userId?: KindeUser['id']
  authOptions?: CanQueryOptions
}) => {
  const { organizationId, userId } = params || {}
  const accountId = userId || (await getActiveUserAccount())?.id
  if (!accountId) return false
  const data = await db.organization.findUnique({
    where: {
      id: organizationId,
      members: {
        some: {
          user: { accountId },
          roles: { has: 'owner' },
        },
      },
    },
    select: { id: true },
  })
  return !!data?.id
}

/** Gets member data for the active user in the provided org. */
export const getActiveUserOrgMember = async (params: {
  organizationId: Organization['id']
  userId?: KindeUser['id']
}) => {
  const { organizationId, userId } = params || {}
  const accountId = userId || (await getActiveUserAccount())?.id
  if (!accountId) return null
  const member = (
    await db.orgMember.findMany({
      where: {
        organizationId: organizationId,
        user: { accountId },
      },
      select: {
        active: true,
        roles: true,
        id: true,
        user: true,
      },
    })
  )?.[0]
  return member ?? null
}

export type ActiveUserOrgMember = Awaited<
  ReturnType<typeof getActiveUserOrgMember>
>
