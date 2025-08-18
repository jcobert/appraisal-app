'use client'

import { FC, useMemo, useState } from 'react'

import Confirmation from '@/components/layout/confirmation'

import { useGetOrgMember } from '@/features/organization/hooks/use-get-org-member'
import MemberForm from '@/features/organization/member/member-form'
import OrgMemberCardBase, {
  OrgMemberCardBaseProps,
} from '@/features/organization/member/org-member-card-base'

type Props = OrgMemberCardBaseProps

const OrgMemberCard: FC<Props> = (props) => {
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const { member } = props

  const { response: activeUserMemberQuery } = useGetOrgMember({
    organizationId: member?.organizationId,
  })

  const isActiveUser = member?.id === activeUserMemberQuery?.data?.id

  const actions = useMemo<OrgMemberCardBaseProps['actions']>(() => {
    const acts: OrgMemberCardBaseProps['actions'] = [
      {
        id: 'edit',
        content: 'Edit',
        onSelect: () => {
          setEditOpen(true)
        },
      },
    ]
    if (!isActiveUser) {
      acts.push({
        id: 'delete',
        content: 'Remove',
        className: 'text-destructive',
        onSelect: () => {
          setDeleteOpen(true)
        },
        disabled: true,
      })
    }
    return acts
  }, [isActiveUser])

  return (
    <>
      {/* <Confirmation
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title='Remove User'
        description={`Are you sure you want to remove ${name} from the organization? This action cannot be undone.`}
        onConfirm={async ({ closeModal }) => {
          const res = await toastyRequest(() => deleteOrgMember.mutateAsync({}))
          if (successful(res?.status)) {
            closeModal()
          }
        }}
      /> */}

      {editOpen ? (
        <MemberForm
          open={editOpen}
          onOpenChange={setEditOpen}
          member={member}
          isActiveUser={isActiveUser}
        />
      ) : null}

      <div className='flex gap-4 items-center'>
        <OrgMemberCardBase className='w-full' actions={actions} {...props} />
      </div>
    </>
  )
}

export default OrgMemberCard
