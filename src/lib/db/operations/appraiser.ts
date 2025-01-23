// sort-imports-ignore
import 'server-only'

import { Prisma } from '@prisma/client'

import { db } from '@/lib/db/client'

import { ProtectOptions, protect } from '@/utils/auth'

export const getAppraisers = async (
  params?: Prisma.AppraiserFindManyArgs,
  options?: ProtectOptions,
) => {
  await protect(options)
  const data = await db.appraiser.findMany(params)
  return data
}

export const getAppraiser = async (
  params: Prisma.AppraiserFindUniqueArgs,
  options?: ProtectOptions,
) => {
  await protect(options)
  const data = await db.appraiser.findUnique(params)
  return data
}

export const createAppraiser = async (
  params: Prisma.AppraiserCreateArgs,
  options?: ProtectOptions,
) => {
  await protect(options)
  const data = await db.appraiser.create(params)
  return data
}

export const updateAppraiser = async (
  params: Prisma.AppraiserUpdateArgs,
  options?: ProtectOptions,
) => {
  await protect(options)
  const data = await db.appraiser.update(params)
  return data
}

export const deleteAppraiser = async (
  params: Prisma.AppraiserDeleteArgs,
  options?: ProtectOptions,
) => {
  await protect(options)
  const data = await db.appraiser.delete(params)
  return data
}
