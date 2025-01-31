'use client'

import { Organization } from '@prisma/client'
import { useRouter } from 'next-nprogress-bar'
import { usePathname } from 'next/navigation'
import { FC } from 'react'
import { FaGear } from 'react-icons/fa6'

import { useGetOrganizations } from '@/components/features/organization/hooks/use-get-organizations'
import Back from '@/components/general/back'
import Button from '@/components/general/button'
import DropdownMenu, {
  DropdownMenuItem,
} from '@/components/layout/dropdown-menu'
import Heading from '@/components/layout/heading'

import { useProtectPage } from '@/hooks/use-protect-page'

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

  const { name } = response?.data || {}

  return (
    <div className='flex flex-col gap-4 max-sm:gap-2'>
      <div>
        <Back href='/organizations' text='Organizations' />
      </div>
      <div className='md:flex justify-between'>
        <div className='flex flex-col gap-2 w-full'>
          <Heading text={name} className='font-normal' />

          <span
            aria-hidden
            className='h-px w-1/2 border-b-2 border-brand-extra-light max-md:hidden'
          />
        </div>
        <DropdownMenu
          trigger={
            <Button
              variant='secondary'
              className='p-2 min-w-0 size-fit max-md:ml-auto'
            >
              <FaGear className='text-lg' />
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
    </div>
  )
}

export default OrganizationPage
