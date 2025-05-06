'use client'

import { FC } from 'react'
import { IoAdd } from 'react-icons/io5'

import Link from '@/components/general/link'

import { useGetOrganizations } from '@/features/organization/hooks/use-get-organizations'
import OrganizationsList from '@/features/organization/organizations-list'

const OrganizationsPage: FC = () => {
  const { response } = useGetOrganizations({ options: { enabled: true } })

  return (
    <div className='flex flex-col gap-8 pb-8'>
      {/* Toolbar */}
      <div className='flex justify-end'>
        <Link variant='secondary' href='/organizations/create'>
          <IoAdd />
          Create organization
        </Link>
      </div>

      <OrganizationsList organizations={response?.data} />
    </div>
  )
}

export default OrganizationsPage
