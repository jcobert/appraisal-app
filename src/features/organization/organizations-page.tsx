'use client'

import { useRouter } from 'next-nprogress-bar'
import { FC } from 'react'
import { IoAdd } from 'react-icons/io5'

import Button from '@/components/general/button'

import { useGetOrganizations } from '@/features/organization/hooks/use-get-organizations'
import OrganizationsList from '@/features/organization/organizations-list'

const OrganizationsPage: FC = () => {
  const router = useRouter()
  const { response } = useGetOrganizations({ options: { enabled: true } })

  return (
    <div className='flex flex-col gap-8 pb-8'>
      {/* Toolbar */}
      <div className='flex justify-end'>
        <Button
          variant='secondary'
          onClick={() => router.push('/organizations/create')}
        >
          <IoAdd />
          Create organization
        </Button>
      </div>

      <OrganizationsList organizations={response?.data} />
    </div>
  )
}

export default OrganizationsPage
