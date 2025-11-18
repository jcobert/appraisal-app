import { FC, ReactNode, useMemo, useState } from 'react'

import { Button, ButtonProps } from '@repo/ui'
import { cn } from '@repo/utils'

import { usePermissions } from '@/hooks/use-permissions'

import DeleteOrgModal from '@/features/organization/settings/general/danger-zone/delete-org-modal'
import LeaveOrgModal from '@/features/organization/settings/general/danger-zone/leave-org-modal'
import TransferOwnerModal from '@/features/organization/settings/general/danger-zone/transfer-owner-modal'
import SectionHeading from '@/features/organization/settings/section-heading'
import { DetailedOrganization } from '@/features/organization/types'

type Props = {
  organization: DetailedOrganization
}

const SubSection: FC<{
  title?: string
  description?: string
  children?: ReactNode
}> = ({ title, description, children }) => {
  return (
    <div className='p-4 flex sm:justify-between sm:items-center max-sm:flex-col max-sm:gap-4'>
      <div>
        <h3 className='font-medium text-balance'>{title}</h3>
        <p className='text-sm leading-6 text-muted-foreground text-pretty'>
          {description}
        </p>
      </div>
      {children}
    </div>
  )
}

const Trigger: FC<ButtonProps> = ({ className, ...props }) => {
  return (
    <Button
      variant='outline'
      className={cn('w-fit text-red-600 hover:text-red-700', className)}
      {...props}
    />
  )
}

const DangerZone: FC<Props> = ({ organization }) => {
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false)
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)

  const { id: organizationId, name: organizationName } = organization

  const { can } = usePermissions({ area: 'organization', organizationId })

  const canDelete = can('delete_org')
  const canTransfer = can('transfer_org')

  const transferTrigger = useMemo(() => {
    return (
      <Trigger
        onClick={() => {
          setIsTransferModalOpen(true)
        }}
      >
        Transfer Ownership
      </Trigger>
    )
  }, [])

  const leaveTrigger = useMemo(() => {
    return (
      <Trigger
        onClick={() => {
          setIsLeaveModalOpen(true)
        }}
      >
        Leave Organization
      </Trigger>
    )
  }, [])

  const deleteTrigger = useMemo(() => {
    return (
      <Trigger
        onClick={() => {
          setIsDeleteModalOpen(true)
        }}
      >
        Delete Organization
      </Trigger>
    )
  }, [])

  return (
    <div className='py-6 flex flex-col gap-3'>
      <SectionHeading title='Danger Zone' />

      <div className='flex flex-col border border-red-100 rounded divide-y'>
        {canTransfer ? (
          <SubSection
            title='Transfer ownership'
            description='Transfer this organization to another user.'
          >
            <TransferOwnerModal
              organization={organization}
              open={isTransferModalOpen}
              onOpenChange={setIsTransferModalOpen}
              trigger={transferTrigger}
            />
          </SubSection>
        ) : null}

        <SubSection
          title='Leave this organization'
          description='Remove yourself from this organization.'
        >
          <LeaveOrgModal
            organizationId={organizationId}
            organizationName={organizationName}
            open={isLeaveModalOpen}
            onOpenChange={setIsLeaveModalOpen}
            trigger={leaveTrigger}
          />
        </SubSection>

        {canDelete ? (
          <SubSection
            title='Delete this organization'
            description='Permanently delete this organization and its data.'
          >
            <DeleteOrgModal
              organizationId={organizationId}
              organizationName={organizationName}
              open={isDeleteModalOpen}
              onOpenChange={setIsDeleteModalOpen}
              trigger={deleteTrigger}
            />
          </SubSection>
        ) : null}
      </div>
    </div>
  )
}

export default DangerZone
