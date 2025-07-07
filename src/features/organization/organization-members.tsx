import { partition } from 'lodash'
import { FC } from 'react'

import Separator from '@/components/general/separator'

import OrgMemberCard from '@/features/organization/member/org-member-card'
import OrgMemberInviteCard from '@/features/organization/member/org-member-invite-card'
import { DetailedOrganization } from '@/features/organization/types'

type Props = {
  organization: DetailedOrganization | null | undefined
}

const OrganizationMembers: FC<Props> = ({ organization }) => {
  const { members, invitations } = organization || {}

  const [owners, others] = partition(members, (m) =>
    m?.roles?.includes('owner'),
  )

  return (
    <div className='flex flex-col gap-4 sm:w-fit'>
      <div className='flex max-sm:flex-col sm:items-center gap-x-4 gap-y-2'>
        <h2 className='text-xl font-medium'>Members</h2>
      </div>

      <div className='flex flex-col gap-2'>
        <div className='flex flex-col gap-2'>
          {owners?.map((m) => (
            // <Link
            //   key={m?.id}
            //   href={`/organizations/${organization?.id}/members/${m?.id}`}
            // >
            <OrgMemberCard key={m?.id} member={m} />
            // </Link>
          ))}
        </div>

        <div className='flex flex-col gap-2'>
          {others?.map((m) => (
            // <Link
            //   key={m?.id}
            //   href={`/organizations/${organization?.id}/members/${m?.id}`}
            // >
            <OrgMemberCard key={m?.id} member={m} />
            // </Link>
          ))}
        </div>
      </div>

      {invitations?.length ? (
        <>
          <Separator />
          <div className='flex flex-col gap-4 sm:w-fit'>
            <h3 className='text-lg font-medium'>Invited</h3>
            <div className='flex flex-col gap-2'>
              {invitations?.map((inv) => (
                <OrgMemberInviteCard key={inv?.id} invitation={inv} />
              ))}
            </div>
          </div>
        </>
      ) : null}
    </div>
  )
}

export default OrganizationMembers
