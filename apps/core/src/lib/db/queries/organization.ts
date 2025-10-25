// sort-imports-ignore
import 'server-only'

import { Organization } from '@repo/database'

import { db } from '@/lib/db/client'

import { getActiveUserAccount } from '@/utils/auth'
import { SessionUser } from '@/types/auth'

export const userIsMember = async (params: {
  organizationId: Organization['id']
  accountId?: SessionUser['id']
}) => {
  const { organizationId, accountId: providedAccountId } = params || {}
  const accountId = providedAccountId || (await getActiveUserAccount())?.id
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
  accountId?: SessionUser['id']
}) => {
  const { organizationId, accountId: providedAccountId } = params || {}
  const accountId = providedAccountId || (await getActiveUserAccount())?.id
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

export const getActiveUserOrgMember = async (params: {
  organizationId: Organization['id']
  accountId?: SessionUser['id']
}) => {
  const { organizationId, accountId: providedAccountId } = params || {}
  const accountId = providedAccountId || (await getActiveUserAccount())?.id
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
