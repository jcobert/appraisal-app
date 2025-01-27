// sort-imports-ignore
import 'server-only'

import { Prisma } from '@prisma/client'

import { db } from '@/lib/db/client'

import { ProtectOptions, getUserId, protect } from '@/utils/auth'

export const getUserProfiles = async (
  params?: Prisma.UserFindManyArgs,
  options?: ProtectOptions,
) => {
  await protect(options)
  const data = await db.user.findMany(params)
  return data
}

export const getUserProfile = async (
  params: Prisma.UserFindUniqueArgs,
  options?: ProtectOptions,
) => {
  await protect(options)
  const data = await db.user.findUnique(params)
  return data
}

export const getActiveUserProfile = async () => {
  await protect()
  const userId = await getUserId()
  const data = await db.user.findUnique({ where: { accountId: userId } })
  return data
}

export const createUserProfile = async (
  params: Prisma.UserCreateArgs,
  options?: ProtectOptions,
) => {
  await protect(options)
  const data = await db.user.create(params)
  return data
}

export const updateUserProfile = async (
  params: Prisma.UserUpdateArgs,
  options?: ProtectOptions,
) => {
  await protect(options)
  const data = await db.user.update(params)
  return data
}

export const deleteUserProfile = async (
  params: Prisma.UserDeleteArgs,
  options?: ProtectOptions,
) => {
  await protect(options)
  const data = await db.user.delete(params)
  return data
}
