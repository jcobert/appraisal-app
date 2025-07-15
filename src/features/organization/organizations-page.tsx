'use client'

import { FC } from 'react'

import { useGetOrganizations } from '@/features/organization/hooks/use-get-organizations'
import OrganizationsList from '@/features/organization/organizations-list'

const OrganizationsPage: FC = () => {
  const { response } = useGetOrganizations({ options: { enabled: true } })

  return (
    <div className='flex flex-col gap-8 pb-8'>
      <OrganizationsList organizations={response?.data} />
    </div>
  )
}

export default OrganizationsPage
