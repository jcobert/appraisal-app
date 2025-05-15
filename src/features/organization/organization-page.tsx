'use client'

import { Organization } from '@prisma/client'
import { sortBy } from 'lodash'
import { usePathname, useRouter } from 'next/navigation'
import { FC } from 'react'
import { FaGear } from 'react-icons/fa6'

import Back from '@/components/general/back'
import Button from '@/components/general/button'
import DropdownMenu, {
  DropdownMenuItem,
} from '@/components/layout/dropdown-menu'
import Heading from '@/components/layout/heading'

import { useProtectPage } from '@/hooks/use-protect-page'

import { useGetOrganizations } from '@/features/organization/hooks/use-get-organizations'
import UserCard from '@/features/user/user-card'

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

  const { name, members = [] } = response?.data || {}

  const sortedMembers = sortBy(members, (m) => {
    if (m?.roles?.includes('owner')) return 1
    if (m?.roles?.includes('manager')) return 2
    return 999
  })

  return (
    <div className='flex flex-col gap-8 max-sm:gap-4'>
      <div>
        <Back href='/organizations' text='Organizations' />
      </div>
      <div className='flex max-md:flex-col md:items-center max-md:gap-4 gap-6'>
        <div className='flex flex-col gap-2 border-b-2 pb-2 md:pr-12 md:pl-0 border-brand-extra-light sm:px-4 sm:w-fit w-full max-md:mx-auto'>
          <Heading text={name} className='font-normal' />
        </div>
        <DropdownMenu
          trigger={
            <Button
              variant='secondary'
              className='p-2 min-w-0 max-w-16 size-fit aspect-square max-md:ml-auto'
            >
              <FaGear className='text-2xl sm:text-lg' />
            </Button>
          }
        >
          <DropdownMenuItem
            onSelect={() => {
              router.push(`${pathname}/edit`)
            }}
          >
            Edit Organization
          </DropdownMenuItem>
        </DropdownMenu>
      </div>

      <div>
        <h2>Members</h2>
        <div>
          {sortedMembers?.map((m) => (
            <UserCard key={m?.id} user={m?.user} roles={m?.roles} />
          ))}
        </div>
      </div>
    </div>
  )
}

export default OrganizationPage
