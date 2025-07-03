import { OrgInvitationStatus, User } from '@prisma/client'
import { upperFirst } from 'lodash'
import { FC } from 'react'
import { HiDotsVertical } from 'react-icons/hi'

import { fullName } from '@/utils/string'
import { cn } from '@/utils/style'

import Avatar from '@/components/general/avatar'
import Button from '@/components/general/button'
import DropdownMenu, {
  DropdownMenuItem,
} from '@/components/layout/dropdown-menu'

import { useOrganizationMutations } from '@/features/organization/hooks/use-organization-mutations'
import {
  DetailedOrgMember,
  DetailedOrganization,
} from '@/features/organization/types'

type Props = {
  user?: Partial<User> | undefined | null
  member?: DetailedOrgMember | null
  organization?: DetailedOrganization | null | undefined
  className?: string
  status?: OrgInvitationStatus
}

const OrgMemberCard: FC<Props> = ({
  user,
  member,
  organization,
  className,
  status,
}) => {
  const { firstName, lastName, avatar } = member?.user || user || {}
  const name = fullName(firstName, lastName)
  const roles = member?.roles

  const userRole = roles?.join(', ')

  // const { deleteOrgMember } = useOrganizationMutations({
  //   organization,
  //   memberId: member?.id,
  // })

  return (
    <div
      className={cn(
        'rounded-xl p-4 group transition flex items-center gap-4',
        className,
      )}
    >
      <div className='flex gap-2 items-center'>
        <Avatar name={name} image={avatar} size='xs' />
        <div className='flex flex-col gap-1'>
          <span className='leading-none transition'>{name}</span>
          {userRole ? (
            <span className='text-sm leading-none capitalize'>{userRole}</span>
          ) : null}
        </div>

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
      </div>

      {/* <DropdownMenu
        trigger={
          <Button
            variant='secondary'
            className='p-2 min-w-0 max-w-16 size-fit aspect-square max-md:ml-auto'
          >
            <HiDotsVertical className='text-2xl sm:text-lg' />
          </Button>
        }
      >
        <DropdownMenuItem className='text-rose-700 text-sm' onSelect={() => {}}>
          Remove from organization
        </DropdownMenuItem>
      </DropdownMenu> */}

      {/* <Button
        variant='tertiary'
        color='danger'
        onClick={async () => {
          await deleteOrgMember.mutateAsync({})
        }}
      >
        Remove
      </Button> */}
    </div>
  )
}

export default OrgMemberCard
