import { OrgMember, Organization, User } from '@prisma/client'

import { filteredQueryKey } from '@/utils/query'

import { PermissionArea } from '@/configuration/permissions'

export const permissionsQueryKey = {
  all: ['permissions'],
  filtered: (params: { organizationId: string; area: PermissionArea }) =>
    filteredQueryKey(params, permissionsQueryKey.all),
} as const

export const organizationsQueryKey = {
  all: ['organizations'],
  filtered: (params: Partial<Organization>) =>
    filteredQueryKey(params, organizationsQueryKey.all),
} as const

export const usersQueryKey = {
  all: ['users'],
  active: ['users', 'active'],
  filtered: (params: Partial<User>) =>
    filteredQueryKey(params, usersQueryKey.all),
} as const

export const orgMemberQueryKey = {
  all: ['organizations', 'members'],
  filtered: (params: {
    organizationId: OrgMember['organizationId']
    memberId?: OrgMember['id']
    activeUser?: boolean
  }) => filteredQueryKey(params, orgMemberQueryKey.all),
} as const
