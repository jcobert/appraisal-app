import { MemberRole } from '@prisma/client'

export const getOrgInviteUrl = ({
  organizationId,
  inviteToken,
  absolute = true,
}: {
  organizationId: string
  inviteToken: string
  absolute?: boolean
}) => {
  if (!organizationId || !inviteToken) return ''
  return `${absolute ? process.env.NEXT_PUBLIC_SITE_BASE_URL : ''}/organization-invite/${organizationId}/join?inv=${inviteToken}`
}

export const ORG_MEMBER_ROLES = [
  MemberRole.owner,
  MemberRole.manager,
  MemberRole.appraiser,
] as const satisfies MemberRole[]
