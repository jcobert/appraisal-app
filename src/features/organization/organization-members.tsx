import { partition } from 'lodash'
import { FC } from 'react'

import MemberInviteForm from '@/features/organization/invitation/member-invite-form'
import {
  DetailedOrgMember,
  DetailedOrganization,
} from '@/features/organization/types'
import UserCard from '@/features/user/user-card'

type Props = {
  organization: DetailedOrganization | null | undefined
  members: DetailedOrgMember[] | null
}

const OrganizationMembers: FC<Props> = ({ organization, members }) => {
  const [owners, others] = partition(members, (m) =>
    m?.roles?.includes('owner'),
  )

  return (
    <div className='flex flex-col gap-2'>
      <h2 className='text-xl font-medium'>Members</h2>

      <MemberInviteForm organization={organization} />

      <div>
        {owners?.map((o) => (
          <UserCard key={o?.id} user={o?.user} roles={o?.roles} />
        ))}
      </div>
      <div>
        {others?.map((m) => (
          <UserCard key={m?.id} user={m?.user} roles={m?.roles} />
        ))}
      </div>
    </div>
  )
}

export default OrganizationMembers
