'use client'

import { Organization } from '@prisma/client'
import { FC, useState } from 'react'
import { useIsClient } from 'usehooks-ts'

import { cn } from '@/lib/utils'

import { Button, ButtonProps } from '@/components/ui/button'

import { useOrgPageRedirect } from '@/hooks/use-org-page-redirect'
import { usePermissions } from '@/hooks/use-permissions'
import { useProtectPage } from '@/hooks/use-protect-page'

import { useGetOrganizations } from '@/features/organization/hooks/use-get-organizations'
import MemberInviteForm from '@/features/organization/invitation/member-invite-form'
import OrgMembersSkeleton from '@/features/organization/member/org-members-skeleton'
import OrganizationMembers from '@/features/organization/member/organization-members'
import SectionHeading from '@/features/organization/settings/section-heading'

type Props = {
  organizationId: Organization['id']
}

const AddMemberButton: FC<{ hidden: boolean } & ButtonProps> = ({
  skeleton,
  hidden,
  className,
  ...props
}) => {
  if (!skeleton && hidden) return null
  return (
    <Button className={cn('w-fit', className)} skeleton={skeleton} {...props}>
      Add member
    </Button>
  )
}

const MembersSettings: FC<Props> = ({ organizationId }) => {
  const {
    session: { isLoading: isCheckingAuth },
  } = useProtectPage()

  const isClient = useIsClient()

  const { can, isLoading: isCheckingPermissions } = usePermissions({
    area: 'organization',
    organizationId,
  })

  useOrgPageRedirect(organizationId)

  const userCanEditMembers = can('edit_org_members')

  const { response } = useGetOrganizations({
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
          <AddMemberButton
            onClick={() => {
              setInviteFormOpen(true)
            }}
            skeleton={!isClient || isCheckingPermissions}
            hidden={!userCanEditMembers}
          />
        </div>

        {!isClient ? (
          <OrgMembersSkeleton />
        ) : (
          <OrganizationMembers organization={organization} hideInvites={!userCanEditMembers} />
        )}
      </div>
    </>
  )
}

export default MembersSettings
