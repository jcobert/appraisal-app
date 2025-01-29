// sort-imports-ignore
import 'server-only'

import { Prisma } from '@prisma/client'

import { db } from '@/lib/db/client'

import { ProtectOptions, getUserId, protect } from '@/utils/auth'

export const getOrganizations = async (
  params?: Prisma.OrganizationFindManyArgs,
  options?: ProtectOptions,
) => {
  await protect(options)
  const data = await db.organization.findMany(params)
  return data
}

export const getUserOrganizations = async (options?: ProtectOptions) => {
  const authorized = await protect({ redirect: false, ...options })
  if (!authorized) return null
  const userId = await getUserId()
  const data = await db.organization.findMany({
    where: { members: { some: { accountId: userId } } },
  })
  return data
}

export const getOrganization = async (
  params: Prisma.OrganizationFindUniqueArgs,
  options?: ProtectOptions,
) => {
  await protect(options)
  const data = await db.organization.findUnique(params)
  return data
}

export const createOrganization = async (
  params: Prisma.OrganizationCreateArgs,
  options?: ProtectOptions,
) => {
  await protect(options)
  const data = await db.organization.create(params)
  return data
}

export const updateOrganization = async (
  params: Prisma.OrganizationUpdateArgs,
  options?: ProtectOptions,
) => {
  await protect(options)
  const data = await db.organization.update(params)
  return data
}

export const deleteOrganization = async (
  params: Prisma.OrganizationDeleteArgs,
  options?: ProtectOptions,
) => {
  await protect(options)
  const data = await db.organization.delete(params)
  return data
}
