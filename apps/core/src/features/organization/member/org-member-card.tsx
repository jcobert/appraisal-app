'use client'

import { FC, useMemo, useState } from 'react'

import Confirmation from '@/components/layout/confirmation'

import { useGetOrgMember } from '@/features/organization/hooks/use-get-org-member'
import { useOrganizationMutations } from '@/features/organization/hooks/use-organization-mutations'
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

  const { removeOrgMember } = useOrganizationMutations({
    organizationId: member?.organizationId,
    memberId: member?.id,
  })

  const isActiveUser = member?.id === activeUserMemberQuery?.data?.id

  const memberName =
    `${member?.user?.firstName || ''} ${member?.user?.lastName || ''}`.trim()

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
      })
    }
    return acts
  }, [isActiveUser])

  return (
    <>
      <Confirmation
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title='Remove Member'
        description={`Are you sure you want to remove ${memberName || 'this member'} from the organization?`}
        onConfirm={async ({ closeModal }) => {
          await removeOrgMember.mutateAsync(
            { active: false },
            {
              onSuccess: () => {
                closeModal()
              },
            },
          )
        }}
      />

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
