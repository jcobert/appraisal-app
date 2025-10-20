import { OrgInvitation, OrgMember, Organization, User } from '@repo/database'

export type DetailedOrgMember = OrgMember & { user?: User }

export type DetailedOrganization = Organization & {
  members?: DetailedOrgMember[]
  invitations?: Partial<OrgInvitation>[]
}
