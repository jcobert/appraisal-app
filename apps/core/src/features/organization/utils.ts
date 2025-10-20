import { MemberRole } from '@repo/database'

export const getOrgInviteUrl = ({
  organizationId,
  inviteToken,
}: {
  organizationId: string
  inviteToken: string
}): { local: string; absolute: string } => {
  if (!organizationId || !inviteToken) return { local: '', absolute: '' }
  const path = `/organization-invite/${organizationId}/join?inv=${inviteToken}`
  return {
    local: path,
    absolute: `${process.env.NEXT_PUBLIC_SITE_BASE_URL}${path}`,
  }
}

export const ORG_MEMBER_ROLES = [
  MemberRole.owner,
  MemberRole.manager,
  MemberRole.appraiser,
] as const satisfies MemberRole[]
