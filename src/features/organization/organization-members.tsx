import { partition } from 'lodash'
import { FC, useState } from 'react'

import Button from '@/components/general/button'
import Modal from '@/components/layout/modal'

import MemberInviteForm from '@/features/organization/invitation/member-invite-form'
import { DetailedOrgMember } from '@/features/organization/types'
import UserCard from '@/features/user/user-card'

type Props = {
  members: DetailedOrgMember[] | null
}

const OrganizationMembers: FC<Props> = ({ members }) => {
  const [formOpen, setFormOpen] = useState(false)

  const [owners, others] = partition(members, (m) =>
    m?.roles?.includes('owner'),
  )

  return (
    <>
      <Modal
        open={formOpen}
        onOpenChange={setFormOpen}
        title='Invite to Organization'
      >
        <MemberInviteForm />
      </Modal>

      <div className='flex flex-col gap-2'>
        <h2 className='text-xl font-medium'>Members</h2>
        <Button
          variant='secondary'
          onClick={() => {
            setFormOpen(true)
          }}
        >
          Add member
        </Button>

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
    </>
  )
}

export default OrganizationMembers
