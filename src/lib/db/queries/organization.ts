// sort-imports-ignore
import 'server-only'

import { Organization, Prisma } from '@prisma/client'

import { db } from '@/lib/db/client'
import { canQuery, CanQueryOptions } from '@/lib/db/utils'

import { getActiveUserAccount } from '@/utils/auth'

/**
 * Returns organizations that user is a member of.
 * When `owner` is true, will return only those that user is owner of (default is false).
 */
export const getUserOrganizations = async (params?: {
  owner?: boolean
  filter?: Prisma.OrganizationFindManyArgs['where']
  authOptions?: CanQueryOptions
}) => {
  const { owner = false, filter, authOptions } = params || {}
  const authorized = await canQuery(authOptions)
  if (!authorized) return null
  const userId = (await getActiveUserAccount())?.id
  const baseFilter: Prisma.OrganizationFindManyArgs['where'] = {
    members: {
      some: {
        user: { accountId: userId },
        ...(owner ? { AND: { roles: { has: 'owner' } } } : {}),
      },
    },
  }
  const data = await db.organization.findMany({
    where: { ...baseFilter, ...filter },
  })
  return data
}

export const userIsMember = async (params?: {
  organizationId: Organization['id']
  authOptions?: CanQueryOptions
}) => {
  const { organizationId, authOptions } = params || {}
  const authorized = await canQuery(authOptions)
  if (!authorized) return false
  const userId = (await getActiveUserAccount())?.id
  const data = await db.organization.findUnique({
    where: {
      id: organizationId,
      members: { some: { user: { accountId: userId } } },
    },
  })
  return !!data?.id
}

export const userIsOwner = async (params?: {
  organizationId: Organization['id']
  authOptions?: CanQueryOptions
}) => {
  const { organizationId, authOptions } = params || {}
  const authorized = await canQuery(authOptions)
  if (!authorized) return false
  const userId = (await getActiveUserAccount())?.id
  const data = await db.organization.findUnique({
    where: {
      id: organizationId,
      members: {
        some: {
          user: { accountId: userId },
          AND: { roles: { has: 'owner' } },
        },
      },
    },
  })
  return !!data?.id
}

export const getOrganization = async (
  params: Prisma.OrganizationFindUniqueArgs,
  authOptions?: CanQueryOptions & { restrictToUser?: boolean },
) => {
  const { restrictToUser = true, ...opts } = authOptions || {}
  const authorized = await canQuery(opts)
  const orgId = params?.where?.id || ''
  if (!authorized || !orgId) return null
  if (restrictToUser) {
    const isMember = await userIsMember({ organizationId: orgId })
    if (!isMember) {
      return null
    }
  }
  const data = await db.organization.findUnique(params)
  return data
}

export const createOrganization = async (
  params: Prisma.OrganizationCreateArgs,
  authOptions?: CanQueryOptions,
) => {
  const authorized = await canQuery(authOptions)
  if (!authorized) return null
  const data = await db.organization.create(params)
  return data
}

export const updateOrganization = async (
  params: Prisma.OrganizationUpdateArgs,
  authOptions?: CanQueryOptions,
) => {
  const authorized = await canQuery(authOptions)
  if (!authorized) return null
  const orgId = params?.where?.id || ''
  const isOwner = await userIsOwner({ organizationId: orgId })
  if (!isOwner) {
    return null
  }
  const data = await db.organization.update(params)
  return data
}

export const deleteOrganization = async (
  params: Prisma.OrganizationDeleteArgs,
  authOptions?: CanQueryOptions,
) => {
  const authorized = await canQuery(authOptions)
  if (!authorized) return null
  const orgId = params?.where?.id || ''
  const isOwner = await userIsOwner({ organizationId: orgId })
  if (!isOwner) {
    return null
  }
  const data = await db.organization.delete(params)
  return data
}

export const inviteUser = async () => {
  
}
