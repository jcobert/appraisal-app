// sort-imports-ignore
import 'server-only'

import { Prisma } from '@prisma/client'

import { db } from '@/lib/db/client'

import { ProtectOptions, getUserId, protect } from '@/utils/auth'
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server'
import { redirect } from 'next/navigation'

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
  const isAllowed = await protect({ redirect: false })
  if (!isAllowed) return null
  const userId = await getUserId()
  const data = await db.user.findUnique({ where: { accountId: userId } })
  return data
}

export const registerUserProfile = async () => {
  await protect()
  const session = getKindeServerSession()
  const user = await session.getUser()
  const currentProfile = await getActiveUserProfile()

  // User profile already exists. Redirect to landing page.
  if (!!currentProfile) {
    redirect('/dashboard')
  }
  const res = await db.user.create({
    data: {
      accountId: user.id,
      createdBy: user?.id,
      updatedBy: user?.id,
      firstName: user?.given_name || '',
      lastName: user?.family_name || '',
      avatar: user?.picture,
      email: user?.email,
      phone: user?.phone_number,
    },
  })
  return res
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
