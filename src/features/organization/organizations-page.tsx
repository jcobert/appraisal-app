'use client'

import Link from 'next/link'
import { FC } from 'react'
import { IoAdd } from 'react-icons/io5'

import { Button } from '@/components/ui/button'

import { useGetOrganizations } from '@/features/organization/hooks/use-get-organizations'
import OrganizationsList from '@/features/organization/organizations-list'

const OrganizationsPage: FC = () => {
  const { response } = useGetOrganizations({ options: { enabled: true } })

  return (
    <div className='flex flex-col gap-8 pb-8'>
      {/* Toolbar */}
      <div className='flex justify-end'>
        <Button asChild variant='outline'>
          <Link href='/organizations/create'>
            <IoAdd />
            Create organization
          </Link>
        </Button>
      </div>

      <OrganizationsList organizations={response?.data} />
    </div>
  )
}

export default OrganizationsPage
