// sort-imports-ignore
import 'server-only'

import { Organization, OrgInvitation, OrgMember, Prisma } from '@prisma/client'

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
        ...(owner ? { roles: { has: 'owner' } } : {}),
      },
    },
  }
  const data = await db.organization.findMany({
    where: { ...baseFilter, ...filter },
  })
  return data
}

export const userIsMember = async (params: {
  organizationId: Organization['id']
  authOptions?: CanQueryOptions
}) => {
  const { organizationId, authOptions } = params || {}
  const authorized = await canQuery(authOptions)
  if (!authorized || !organizationId) return false
  const userId = (await getActiveUserAccount())?.id
  const data = await db.organization.findUnique({
    where: {
      id: organizationId,
      members: { some: { user: { accountId: userId } } },
    },
  })
  return !!data?.id
}

export const userIsOwner = async (params: {
  organizationId: Organization['id']
  authOptions?: CanQueryOptions
}) => {
  const { organizationId, authOptions } = params || {}
  const authorized = await canQuery(authOptions)
  if (!authorized || !organizationId) return false
  const userId = (await getActiveUserAccount())?.id
  const data = await db.organization.findUnique({
    where: {
      id: organizationId,
      members: {
        some: {
          user: { accountId: userId },
          roles: { has: 'owner' },
        },
      },
    },
  })
  return !!data?.id
}

/** Gets organization by `id`. */
export const getOrganization = async (params: {
  organizationId: Organization['id']
  // query?: Prisma.OrganizationFindUniqueArgs
  authOptions?: CanQueryOptions & { restrictToUser?: boolean }
}) => {
  const { organizationId, authOptions } = params
  const { restrictToUser = true, ...opts } = authOptions || {}
  const authorized = await canQuery(opts)
  if (!authorized) return null
  if (restrictToUser) {
    const isMember = await userIsMember({ organizationId })
    if (!isMember) {
      return null
    }
  }

  const queryArgs = {
    where: { id: organizationId },
    include: {
      members: {
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              avatar: true,
              email: true,
            },
          },
        },
        omit: { createdBy: true, updatedBy: true },
      },
      invitations: {
        where: { status: { in: ['expired', 'pending'] } },
        select: {
          id: true,
          status: true,
          expires: true,
          inviteeFirstName: true,
          inviteeLastName: true,
          inviteeEmail: true,
          roles: true,
          organizationId: true,
        },
      },
    },
    omit: { createdBy: true, updatedBy: true },
    // ...query,
  } satisfies Prisma.OrganizationFindUniqueArgs

  const data = await db.organization.findUnique(queryArgs)
  return data
}

export const getOrgMemberRoles = async (params: {
  organizationId: Organization['id']
}) => {
  try {
    const { organizationId } = params || {}
    const authorized = await canQuery()
    const user = await getActiveUserAccount()
    if (!authorized || !user?.id) return []
    const member = (
      await db.orgMember.findMany({
        where: {
          organizationId: organizationId,
          user: { accountId: user?.id },
        },
        select: { active: true, roles: true },
      })
    )?.[0]
    if (!member || !member?.active || !member?.roles?.length) return []
    return member?.roles
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error)
    return []
  }
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

export const updateOrganization = async (params: {
  organizationId: Organization['id']
  payload: Prisma.OrganizationUpdateArgs['data']
  queryOptions?: Omit<Prisma.OrganizationUpdateArgs, 'data' | 'where'>
  authOptions?: CanQueryOptions
}) => {
  const { organizationId, payload, queryOptions, authOptions } = params
  const authorized = await canQuery(authOptions)
  if (!authorized) return null

  const isOwner = await userIsOwner({ organizationId })
  if (!isOwner) {
    return null
  }

  const queryArgs = {
    where: { id: organizationId },
    data: payload,
    ...queryOptions,
  } satisfies Prisma.OrganizationUpdateArgs

  const data = await db.organization.update(queryArgs)
  return data
}

export const deleteOrganization = async (params: {
  organizationId: Organization['id']
  query?: Prisma.OrganizationDeleteArgs
  authOptions?: CanQueryOptions
}) => {
  const { organizationId, authOptions, query } = params
  const authorized = await canQuery(authOptions)
  if (!authorized) return null
  const isOwner = await userIsOwner({ organizationId })
  if (!isOwner) {
    return null
  }
  const queryArgs = {
    where: { id: organizationId },
    ...query,
  } satisfies typeof query

  const data = await db.organization.delete(queryArgs)
  return data
}

export const getOrgMember = async (params: {
  organizationId: OrgMember['organizationId']
  memberId: OrgMember['id']
  query?: Prisma.OrgMemberFindUniqueArgs
  authOptions?: CanQueryOptions
}) => {
  const { organizationId, memberId, query, authOptions } = params
  const authorized = await canQuery(authOptions)
  if (!authorized || !memberId) return null
  const isMember = await userIsMember({ organizationId })
  if (!isMember) {
    return null
  }

  const queryArgs = {
    where: { id: memberId, organizationId },
    include: { user: true },
    ...query,
  } satisfies typeof query

  const data = await db.orgMember.findUnique(queryArgs)
  return data
}

export const updateOrgMember = async (params: {
  organizationId: OrgMember['organizationId']
  memberId: OrgMember['id']
  payload: Prisma.OrgMemberUpdateArgs['data']
  queryOptions?: Omit<Prisma.OrgMemberUpdateArgs, 'data' | 'where'>
  authOptions?: CanQueryOptions
}) => {
  const { organizationId, memberId, payload, queryOptions, authOptions } =
    params
  const authorized = await canQuery(authOptions)
  if (!authorized) return null
  const isOwner = await userIsOwner({ organizationId })
  if (!isOwner) {
    return null
  }

  const queryArgs = {
    where: { id: memberId, organizationId },
    data: payload,
    ...queryOptions,
  } satisfies Prisma.OrgMemberUpdateArgs

  const data = await db.orgMember.update(queryArgs)
  return data
}

export const deleteOrgMember = async (params: {
  organizationId: OrgMember['organizationId']
  memberId: OrgMember['id']
  query?: Prisma.OrgMemberDeleteArgs
  authOptions?: CanQueryOptions
}) => {
  const { organizationId, memberId, query, authOptions } = params
  const authorized = await canQuery(authOptions)
  if (!authorized) return null
  const isOwner = await userIsOwner({ organizationId })
  if (!isOwner) {
    return null
  }

  const queryArgs = {
    where: { id: memberId, organizationId },
    ...query,
  } satisfies typeof query

  const data = await db.orgMember.delete(queryArgs)
  return data
}

export const getOrgInvitation = async <
  TParams extends Prisma.OrgInvitationFindUniqueArgs,
>(
  params: TParams,
  authOptions?: CanQueryOptions & { publicAccess?: boolean },
) => {
  const { publicAccess = false, ...opts } = authOptions || {}
  const authorized = publicAccess || (await canQuery(opts))
  if (!authorized) return null

  const queryArgs = {
    select: {
      id: true,
      expires: true,
      status: true,
      organization: { select: { name: true, avatar: true } },
      invitedBy: { select: { firstName: true, lastName: true, email: true } },
      inviteeFirstName: true,
      inviteeLastName: true,
      inviteeEmail: true,
      roles: true,
    },
    ...params,
  } satisfies TParams

  const data = await db.orgInvitation.findUnique(queryArgs)
  return data
}

export const getOrgInvitations = async <
  TParams extends Prisma.OrgInvitationFindManyArgs,
>(
  params: TParams,
  authOptions?: CanQueryOptions & { publicAccess?: boolean },
) => {
  const { publicAccess = false, ...opts } = authOptions || {}
  const authorized = publicAccess || (await canQuery(opts))
  if (!authorized) return null

  const queryArgs = {
    select: {
      id: true,
      expires: true,
      status: true,
      organization: { select: { name: true, avatar: true } },
      invitedBy: { select: { firstName: true, lastName: true, email: true } },
      inviteeFirstName: true,
      inviteeLastName: true,
      inviteeEmail: true,
      roles: true,
    },
    ...params,
  } satisfies TParams

  const data = await db.orgInvitation.findMany(queryArgs)
  return data
}

export const createOrgInvitation = async (
  params: Prisma.OrgInvitationCreateArgs,
  authOptions?: CanQueryOptions,
) => {
  const authorized = await canQuery(authOptions)
  if (!authorized) return null
  const data = await db.orgInvitation.create(params)
  return data
}

export const updateOrgInvitation = async (
  params: Prisma.OrgInvitationUpdateArgs,
  authOptions?: CanQueryOptions & { publicAccess?: boolean },
) => {
  const { publicAccess = false, ...opts } = authOptions || {}
  const authorized = publicAccess || (await canQuery(opts))
  if (!authorized) return null
  const data = await db.orgInvitation.update(params)
  return data
}

export const deleteOrgInvitation = async (params: {
  organizationId: OrgMember['organizationId']
  inviteId: OrgInvitation['id']
  query?: Prisma.OrgInvitationDeleteArgs
  authOptions?: CanQueryOptions
}) => {
  const { organizationId, inviteId, query, authOptions } = params
  const { ...opts } = authOptions || {}
  const authorized = await canQuery(opts)
  if (!authorized) return null
  const isOwner = await userIsOwner({ organizationId })
  if (!isOwner) return null

  const queryArgs = {
    where: { id: inviteId, organizationId },
    ...query,
  } satisfies typeof query

  const data = await db.orgInvitation.delete(queryArgs)
  return data
}
