import { Organization } from '@prisma/client'
import { FC } from 'react'

import OrganizationCard from '@/features/organization/organization-card'

type Props = {
  organizations?: Organization[] | null
}

const OrganizationsList: FC<Props> = ({ organizations }) => {
  if (!organizations?.length) return null

  return (
    <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
      {organizations?.map((organization) => (
        <OrganizationCard key={organization.id} organization={organization} />
      ))}
    </div>
  )
}

export default OrganizationsList
