import { OrgInvitation } from '@prisma/client'
import { upperFirst } from 'lodash'
import { FC, useState } from 'react'

import { successful } from '@/utils/fetch'
import { cn } from '@/utils/style'

import Confirmation from '@/components/layout/confirmation'

import { useOrganizationMutations } from '@/features/organization/hooks/use-organization-mutations'
import OrgMemberCard, {
  OrgMemberCardProps,
} from '@/features/organization/org-member-card'

type Props = Omit<OrgMemberCardProps, 'member'> & {
  invitation: Partial<OrgInvitation> | null | undefined
}

const OrgMemberInviteCard: FC<Props> = ({ invitation, ...props }) => {
  const { inviteeFirstName, inviteeLastName, roles, status } = invitation || {}

  const [cancelOpen, setCancelOpen] = useState(false)

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
          const res = await deleteOrgInvitation.mutateAsync({})
          if (successful(res?.status)) {
            closeModal()
          }
        }}
      />

      <div className='flex gap-4 items-center'>
        <OrgMemberCard
          className='w-full'
          member={{
            user: { firstName: inviteeFirstName, lastName: inviteeLastName },
            roles,
          }}
          actions={[
            {
              id: 'edit',
              content: 'Edit',
              onSelect: () => {},
              disabled: true,
            },
            {
              id: 'cancel',
              content: 'Cancel',
              // className: 'text-rose-700',
              onSelect: () => {
                setCancelOpen(true)
              },
              // disabled: true,
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
        </OrgMemberCard>
      </div>
    </>
  )
}

export default OrgMemberInviteCard
