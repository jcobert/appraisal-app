// sort-imports-ignore
import 'server-only'

import { Prisma } from '@prisma/client'

import { db } from '@/lib/db/client'
import { canQuery, CanQueryOptions } from '@/lib/db/utils'

export const getAppraisers = async (
  params?: Prisma.AppraiserFindManyArgs,
  authOptions?: CanQueryOptions,
) => {
  const authorized = await canQuery(authOptions)
  if (!authorized) return null
  const data = await db.appraiser.findMany(params)
  return data
}

export const getAppraiser = async (
  params: Prisma.AppraiserFindUniqueArgs,
  authOptions?: CanQueryOptions,
) => {
  const authorized = await canQuery(authOptions)
  if (!authorized) return null
  const data = await db.appraiser.findUnique(params)
  return data
}

export const createAppraiser = async (
  params: Prisma.AppraiserCreateArgs,
  authOptions?: CanQueryOptions,
) => {
  const authorized = await canQuery(authOptions)
  if (!authorized) return null
  const data = await db.appraiser.create(params)
  return data
}

export const updateAppraiser = async (
  params: Prisma.AppraiserUpdateArgs,
  authOptions?: CanQueryOptions,
) => {
  const authorized = await canQuery(authOptions)
  if (!authorized) return null
  const data = await db.appraiser.update(params)
  return data
}

export const deleteAppraiser = async (
  params: Prisma.AppraiserDeleteArgs,
  authOptions?: CanQueryOptions,
) => {
  const authorized = await canQuery(authOptions)
  if (!authorized) return null
  const data = await db.appraiser.delete(params)
  return data
}
