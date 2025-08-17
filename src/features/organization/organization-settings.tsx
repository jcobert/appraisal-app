import { FC } from 'react'

import { cn } from '@/utils/style'

import OrganizationMembers from '@/features/organization/organization-members'
import { DetailedOrganization } from '@/features/organization/types'

type Props = {
  organization: DetailedOrganization | null | undefined
  className?: string
}

const OrganizationSettings: FC<Props> = ({ organization, className }) => {
  return (
    <div className={cn(className)}>
      <OrganizationMembers organization={organization} />
    </div>
  )
}

export default OrganizationSettings
