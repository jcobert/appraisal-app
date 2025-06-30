import { partition } from 'lodash'
import { FC } from 'react'

import Separator from '@/components/general/separator'

import MemberInviteForm from '@/features/organization/invitation/member-invite-form'
import {
  DetailedOrgMember,
  DetailedOrganization,
} from '@/features/organization/types'
import UserCard from '@/features/user/user-card'

type Props = {
  organization: DetailedOrganization | null | undefined
  members: DetailedOrgMember[] | null
  invitations: DetailedOrganization['invitations']
}

const OrganizationMembers: FC<Props> = ({
  organization,
  members,
  invitations,
}) => {
  const [owners, others] = partition(members, (m) =>
    m?.roles?.includes('owner'),
  )

  return (
    <div className='flex flex-col gap-6 sm:w-fit'>
      <div className='flex flex-col gap-2'>
        <div className='flex max-sm:flex-col sm:items-center gap-x-4 gap-y-2'>
          <h2 className='text-xl font-medium'>Members</h2>
          <MemberInviteForm organization={organization} />
        </div>

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

      {invitations?.length ? (
        <>
          <Separator />
          <div>
            <div>
              <h3 className='text-lg font-medium'>Invited</h3>
              {invitations?.map((inv) => (
                <UserCard
                  key={inv?.id}
                  user={{
                    firstName: inv?.inviteeFirstName || '',
                    lastName: inv?.inviteeLastName || '',
                  }}
                  status={inv?.status}
                />
              ))}
            </div>
          </div>
        </>
      ) : null}
    </div>
  )
}

export default OrganizationMembers
