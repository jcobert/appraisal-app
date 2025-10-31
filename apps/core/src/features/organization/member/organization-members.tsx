import { partition } from 'lodash'
import { FC } from 'react'

import { Separator } from '@repo/ui'

import OrgMemberCard from '@/features/organization/member/org-member-card'
import OrgMemberInviteCard from '@/features/organization/member/org-member-invite-card'
import { DetailedOrganization } from '@/features/organization/types'

type Props = {
  organization: DetailedOrganization | null | undefined
  hideInvites?: boolean
}

const OrganizationMembers: FC<Props> = ({
  organization,
  hideInvites = true,
}) => {
  const { members, invitations } = organization || {}

  const [owners, others] = partition(members, (m) =>
    m?.roles?.includes('owner'),
  )

  return (
    <div className='flex flex-col gap-4 sm:w-fit'>
      <div className='flex flex-col gap-2'>
        <div className='flex flex-col gap-2'>
          {owners?.map((m) => <OrgMemberCard key={m?.id} member={m} />)}
        </div>

        <div className='flex flex-col gap-2'>
          {others?.map((m) => <OrgMemberCard key={m?.id} member={m} />)}
        </div>
      </div>

      {!invitations?.length && !hideInvites ? (
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
