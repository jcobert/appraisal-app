import { OrgInvitation, OrgMember, Organization, User } from '@prisma/client'

export type DetailedOrgMember = OrgMember & { user?: User }

export type DetailedOrganization = Organization & {
  members?: DetailedOrgMember[]
  invitations?: Partial<OrgInvitation>[]
}
