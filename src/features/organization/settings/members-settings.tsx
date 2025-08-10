'use client'

import { Organization } from '@prisma/client'
import { FC, useState } from 'react'

import { Button } from '@/components/ui/button'

import { useOrgPageRedirect } from '@/hooks/use-org-page-redirect'
import { usePermissions } from '@/hooks/use-permissions'
import { useProtectPage } from '@/hooks/use-protect-page'

import { useGetOrganizations } from '@/features/organization/hooks/use-get-organizations'
import MemberInviteForm from '@/features/organization/invitation/member-invite-form'
import OrgMembersSkeleton from '@/features/organization/member/org-members-skeleton'
import OrganizationMembers from '@/features/organization/organization-members'
import SectionHeading from '@/features/organization/settings/section-heading'

type Props = {
  organizationId: Organization['id']
}

const MembersSettings: FC<Props> = ({ organizationId }) => {
  const {
    session: { isLoading: isCheckingAuth },
  } = useProtectPage()

  const { can, isLoading: isCheckingPermissions } = usePermissions({
    area: 'organization',
    organizationId,
  })

  useOrgPageRedirect(organizationId)

  const userCanAddMembers = can('edit_org_members')

  const { response, isLoading: isFetchingOrg } = useGetOrganizations({
    id: organizationId,
    options: { enabled: !isCheckingAuth && !isCheckingPermissions },
  })

  const organization = response?.data

  const [inviteFormOpen, setInviteFormOpen] = useState(false)

  return (
    <>
      {inviteFormOpen ? (
        <MemberInviteForm
          open={inviteFormOpen}
          onOpenChange={setInviteFormOpen}
          organization={organization}
        />
      ) : null}

      <div className='flex flex-col gap-8 max-sm:gap-4 py-6 px-2'>
        <div className='flex sm:justify-between max-sm:flex-col gap-y-4'>
          <SectionHeading
            title='Members'
            subtitle='Manage members of your organization.'
          />
          {userCanAddMembers ? (
            <Button
              className='w-fit'
              onClick={() => {
                setInviteFormOpen(true)
              }}
            >
              Add member
            </Button>
          ) : null}
        </div>

        {isFetchingOrg || !organization ? (
          <OrgMembersSkeleton />
        ) : (
          <OrganizationMembers organization={organization} />
        )}
      </div>
    </>
  )
}

export default MembersSettings
