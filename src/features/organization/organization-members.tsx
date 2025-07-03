import { partition } from 'lodash'
import Link from 'next/link'
import { FC } from 'react'

import Separator from '@/components/general/separator'

import MemberInviteForm from '@/features/organization/invitation/member-invite-form'
import OrgMemberCard from '@/features/organization/org-member-card'
import {
  DetailedOrgMember,
  DetailedOrganization,
} from '@/features/organization/types'

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
          {owners?.map((m) => (
            <OrgMemberCard
              key={m?.id}
              member={m}
              user={m?.user}
              organization={organization}
            />
          ))}
        </div>
        <div>
          {others?.map((m) => (
            <Link
              key={m?.id}
              href={`/organizations/${organization?.id}/members/${m?.id}`}
            >
              <OrgMemberCard
                member={m}
                user={m?.user}
                organization={organization}
              />
            </Link>
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
                <OrgMemberCard
                  key={inv?.id}
                  user={{
                    firstName: inv?.inviteeFirstName || '',
                    lastName: inv?.inviteeLastName || '',
                  }}
                  organization={organization}
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
