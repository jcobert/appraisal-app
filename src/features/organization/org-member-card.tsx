import { DropdownMenuItemProps } from '@radix-ui/react-dropdown-menu'
import { FC, ReactNode } from 'react'
import { HiDotsVertical } from 'react-icons/hi'

import { fullName } from '@/utils/string'
import { cn } from '@/utils/style'

import Avatar from '@/components/general/avatar'
import Button from '@/components/general/button'
import DropdownMenu, {
  DropdownMenuItem,
} from '@/components/layout/dropdown-menu'

import { DeepPartial } from '@/types/general'

import { DetailedOrgMember } from '@/features/organization/types'

export type OrgMemberCardProps = {
  member?: DeepPartial<DetailedOrgMember> | null
  className?: string
  children?: ReactNode
  actions?: ({ id: string; content: ReactNode } & Pick<
    DropdownMenuItemProps,
    'onSelect' | 'className' | 'disabled'
  >)[]
}

const OrgMemberCard: FC<OrgMemberCardProps> = ({
  member,
  className,
  children,
  actions,
}) => {
  const { user, roles } = member || {}
  const { firstName, lastName, avatar } = user || {}

  const name = fullName(firstName, lastName)

  const userRoles = roles?.join(', ')

  // const { deleteOrgMember } = useOrganizationMutations({
  //   organizationId,
  //   memberId: member?.id,
  // })

  return (
    <div
      className={cn(
        'rounded-xl p-4 group transition flex items-center justify-between gap-4',
        'border',
        className,
      )}
    >
      <div className='flex gap-4 items-center'>
        <div className='flex gap-2 items-center'>
          <Avatar name={name} image={avatar} size='xs' />
          <div className='flex flex-col gap-1'>
            <span className='leading-none transition'>{name}</span>
            {userRoles ? (
              <span className='text-sm text-gray-700 leading-none capitalize'>
                {userRoles}
              </span>
            ) : null}
          </div>
        </div>

        {children}
      </div>

      {actions?.length ? (
        <DropdownMenu
          trigger={
            <Button
              variant='tertiary'
              className='p-2 min-w-0 max-w-16 size-fit rounded-full aspect-square'
            >
              <HiDotsVertical className='text-2xl sm:text-lg' />
            </Button>
          }
        >
          {actions?.map(({ id, content, ...itemProps }) => (
            <DropdownMenuItem key={id} {...itemProps}>
              {content}
            </DropdownMenuItem>
          ))}
        </DropdownMenu>
      ) : null}
    </div>
  )
}

export default OrgMemberCard
