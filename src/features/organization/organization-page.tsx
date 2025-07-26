'use client'

import { Organization } from '@prisma/client'
import { usePathname, useRouter } from 'next/navigation'
import { FC, useState } from 'react'
import { FaGear } from 'react-icons/fa6'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

import { usePermissions } from '@/hooks/use-permissions'
import { useProtectPage } from '@/hooks/use-protect-page'

import { useGetOrganizations } from '@/features/organization/hooks/use-get-organizations'
import MemberInviteForm from '@/features/organization/invitation/member-invite-form'
import OrganizationSettings from '@/features/organization/organization-settings'

type Props = {
  organizationId: Organization['id']
}

const OrganizationPage: FC<Props> = ({ organizationId }) => {
  useProtectPage()

  const router = useRouter()
  const pathname = usePathname()

  const { can } = usePermissions({
    area: 'organization',
    organizationId,
  })

  const userCanEditOrg = can('edit_org_info')
  const userCanAddMembers = can('edit_org_members')

  const { response } = useGetOrganizations({
    id: organizationId,
    options: { enabled: true },
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

      <div className='flex flex-col gap-8 max-sm:gap-4'>
        {userCanEditOrg ? (
          <div className='flex max-md:flex-col md:items-center max-md:gap-4 gap-6'>
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <Button
                  variant='outline'
                  size='icon'
                  className='max-md:ml-auto'
                >
                  <FaGear className='text-2xl sm:text-lg' />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem
                  onSelect={() => {
                    router.push(`${pathname}/edit`)
                  }}
                  disabled={!userCanEditOrg}
                >
                  Edit Info
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => {
                    setInviteFormOpen(true)
                  }}
                  disabled={!userCanAddMembers}
                >
                  Add Member
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ) : null}

        <OrganizationSettings organization={organization} />
      </div>
    </>
  )
}

export default OrganizationPage
