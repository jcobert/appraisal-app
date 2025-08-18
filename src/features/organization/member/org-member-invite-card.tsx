import { OrgInvitation } from '@prisma/client'
import { upperFirst } from 'lodash'
import { FC, useState } from 'react'

import { successful } from '@/utils/fetch'
import { fullName } from '@/utils/string'
import { cn } from '@/utils/style'
import { toastyRequest } from '@/utils/toast'

import Confirmation from '@/components/layout/confirmation'

import { useOrganizationMutations } from '@/features/organization/hooks/use-organization-mutations'
import MemberInviteForm from '@/features/organization/invitation/member-invite-form'
import OrgMemberCardBase, {
  OrgMemberCardBaseProps,
} from '@/features/organization/member/org-member-card-base'

type Props = Omit<OrgMemberCardBaseProps, 'member'> & {
  invitation: Partial<OrgInvitation> | null | undefined
}

const OrgMemberInviteCard: FC<Props> = ({ invitation, ...props }) => {
  const { inviteeFirstName, inviteeLastName, roles, status } = invitation || {}

  const [cancelOpen, setCancelOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)

  const { deleteOrgInvitation } = useOrganizationMutations({
    organizationId: invitation?.organizationId,
    inviteId: invitation?.id,
  })

  return (
    <>
      <Confirmation
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        title='Cancel Invitation'
        description='Are you sure you want to cancel this invitation?'
        onConfirm={async ({ closeModal }) => {
          const res = await toastyRequest(
            () => deleteOrgInvitation.mutateAsync({}),
            {
              success: `Invitation for ${fullName(inviteeFirstName, inviteeLastName)} has been canceled.`,
            },
          )
          if (successful(res?.status)) {
            closeModal()
          }
        }}
        primaryButtonText='Yes, continue'
        cancelButtonText='Never mind'
      />
      {editOpen ? (
        <MemberInviteForm
          open={editOpen}
          onOpenChange={setEditOpen}
          organization={{ id: invitation?.organizationId }}
          initialData={invitation}
        />
      ) : null}

      <div className='flex gap-4 items-center'>
        <OrgMemberCardBase<true>
          className='w-full'
          member={{
            user: { firstName: inviteeFirstName, lastName: inviteeLastName },
            roles,
          }}
          actions={[
            {
              id: 'edit',
              content: 'Edit',
              onSelect: () => {
                setEditOpen(true)
              },
            },
            {
              id: 'cancel',
              content: 'Cancel',
              className: 'text-destructive',
              onSelect: () => {
                setCancelOpen(true)
              },
            },
          ]}
          {...props}
        >
          {status ? (
            <span
              className={cn('text-sm', [
                status === 'expired' && 'text-rose-700',
                status === 'pending' && 'text-gray-500',
              ])}
            >
              {`(${upperFirst(status)})`}
            </span>
          ) : null}
        </OrgMemberCardBase>
      </div>
    </>
  )
}

export default OrgMemberInviteCard
