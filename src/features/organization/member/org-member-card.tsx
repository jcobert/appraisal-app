import { FC, useState } from 'react'

import { successful } from '@/utils/fetch'
import { fullName } from '@/utils/string'
import { toastyRequest } from '@/utils/toast'

import Confirmation from '@/components/layout/confirmation'

import { useOrganizationMutations } from '@/features/organization/hooks/use-organization-mutations'
import OrgMemberCardBase, {
  OrgMemberCardBaseProps,
} from '@/features/organization/member/org-member-card-base'

type Props = OrgMemberCardBaseProps

const OrgMemberCard: FC<Props> = (props) => {
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const { updateOrgMember, deleteOrgMember } = useOrganizationMutations({
    organizationId: props.member?.organizationId,
    memberId: props.member?.id,
  })

  // const name = fullName(
  //   props?.member?.user?.firstName,
  //   props?.member?.user?.lastName,
  // )

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

      <div className='flex gap-4 items-center'>
        <OrgMemberCardBase
          className='w-full'
          actions={[
            {
              id: 'edit',
              content: 'Edit',
              onSelect: () => {
                setEditOpen(true)
              },
              disabled: true,
            },
            // {
            //   id: 'delete',
            //   content: 'Remove',
            //   // className: 'text-rose-700',
            //   onSelect: () => {
            //     setDeleteOpen(true)
            //   },
            // },
          ]}
          {...props}
        />
      </div>
    </>
  )
}

export default OrgMemberCard
