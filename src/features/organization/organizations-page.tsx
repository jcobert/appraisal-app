'use client'

import { useRouter } from 'next-nprogress-bar'
import { FC } from 'react'
import { FiUserPlus } from 'react-icons/fi'

import { useGetOrganizations } from '@/features/organization/hooks/use-get-organizations'
import OrganizationsList from '@/features/organization/organizations-list'
import Button from '@/components/general/button'

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
          <FiUserPlus />
          Add organization
        </Button>
      </div>

      <OrganizationsList organizations={response?.data} />
    </div>
  )
}

export default OrganizationsPage
