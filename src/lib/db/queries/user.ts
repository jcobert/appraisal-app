// sort-imports-ignore
import 'server-only'

import { Prisma } from '@prisma/client'

import { db } from '@/lib/db/client'
import { canQuery, CanQueryOptions } from '@/lib/db/utils'

import { getActiveUserAccount } from '@/utils/auth'
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server'
import { redirect } from 'next/navigation'

export const getUserProfiles = async (
  params?: Prisma.UserFindManyArgs,
  authOptions?: CanQueryOptions,
) => {
  const authorized = await canQuery(authOptions)
  if (!authorized) return null
  const data = await db.user.findMany(params)
  return data
}

export const getUserProfile = async (
  params: Prisma.UserFindUniqueArgs,
  authOptions?: CanQueryOptions,
) => {
  const authorized = await canQuery(authOptions)
  if (!authorized) return null
  const data = await db.user.findUnique(params)
  return data
}

export const getActiveUserProfile = async (authOptions?: CanQueryOptions) => {
  const authorized = await canQuery(authOptions)
  if (!authorized) return null
  const userId = (await getActiveUserAccount())?.id
  const data = await db.user.findUnique({ where: { accountId: userId } })
  return data
}

export const registerUserProfile = async (
  options?: CanQueryOptions & { redirectIfExists?: boolean },
) => {
  const { redirectIfExists = true, ...authOptions } = options || {}

  const authorized = await canQuery(authOptions)
  if (!authorized) return null
  const session = getKindeServerSession()
  const user = await session.getUser()
  const currentProfile = await getActiveUserProfile()

  // User profile already exists. Redirect to landing page.
  if (!!currentProfile) {
    if (!redirectIfExists) return
    redirect('/dashboard')
  }

  const res = await db.user.create({
    data: {
      accountId: user.id,
      createdBy: user?.id,
      updatedBy: user?.id,
      firstName: user?.given_name || '',
      lastName: user?.family_name || '',
      email: user?.email || '',
      phone: user?.phone_number,
      avatar: user?.picture,
    },
  })
  return res
}

export const createUserProfile = async (
  params: Prisma.UserCreateArgs,
  authOptions?: CanQueryOptions,
) => {
  const authorized = await canQuery(authOptions)
  if (!authorized) return null
  const data = await db.user.create(params)
  return data
}

export const updateUserProfile = async (
  params: Prisma.UserUpdateArgs,
  authOptions?: CanQueryOptions,
) => {
  const authorized = await canQuery(authOptions)
  if (!authorized) return null
  const data = await db.user.update(params)
  return data
}

export const deleteUserProfile = async (
  params: Prisma.UserDeleteArgs,
  authOptions?: CanQueryOptions,
) => {
  const authorized = await canQuery(authOptions)
  if (!authorized) return null
  const data = await db.user.delete(params)
  return data
}
