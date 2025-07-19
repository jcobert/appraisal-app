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

import { useProtectPage } from '@/hooks/use-protect-page'

import { useGetOrganizations } from '@/features/organization/hooks/use-get-organizations'
import MemberInviteForm from '@/features/organization/invitation/member-invite-form'
import OrganizationSettings from '@/features/organization/organization-settings'

type Props = {
  organizationId?: Organization['id']
}

const OrganizationPage: FC<Props> = ({ organizationId }) => {
  useProtectPage()

  const router = useRouter()
  const pathname = usePathname()

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
        <div className='flex max-md:flex-col md:items-center max-md:gap-4 gap-6'>
          {/* <div className='flex flex-col gap-2 border-b-2__ pb-2 md:pr-12 md:pl-0 border-brand-extra-light sm:px-4 sm:w-fit w-full max-md:mx-auto'>
            <Heading text={name} className='font-normal' />
          </div> */}
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <Button variant='outline' size='icon' className='max-md:ml-auto'>
                <FaGear className='text-2xl sm:text-lg' />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem
                onSelect={() => {
                  router.push(`${pathname}/edit`)
                }}
              >
                Edit Info
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => {
                  setInviteFormOpen(true)
                }}
              >
                Add Member
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <OrganizationSettings organization={organization} />
      </div>
    </>
  )
}

export default OrganizationPage
