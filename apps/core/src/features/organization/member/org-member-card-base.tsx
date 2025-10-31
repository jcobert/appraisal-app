import { DropdownMenuItemProps } from '@radix-ui/react-dropdown-menu'
import { ReactNode } from 'react'
import { SlOptionsVertical } from 'react-icons/sl'

import { DeepPartial } from '@repo/types'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@repo/ui'
import { cn, fullName } from '@repo/utils'

import Avatar from '@/components/general/avatar'

import { DetailedOrgMember } from '@/features/organization/types'

export type OrgMemberCardBaseProps<TInvite extends boolean = false> = {
  member: TInvite extends true
    ? DeepPartial<DetailedOrgMember> | null
    : DetailedOrgMember
  className?: string
  children?: ReactNode
  actions?: ({ id: string; content: ReactNode } & Pick<
    DropdownMenuItemProps,
    'onSelect' | 'className' | 'disabled'
  >)[]
}

const OrgMemberCardBase = <TInvite extends boolean = false>({
  member,
  className,
  children,
  actions,
}: OrgMemberCardBaseProps<TInvite>) => {
  const { user, roles } = member || {}
  const { firstName, lastName, avatar } = user || {}

  const name = fullName(firstName, lastName)

  const userRoles = roles?.join(', ')

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
          <Avatar name={name} image={avatar} />
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
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <Button variant='ghost' size='icon'>
              <SlOptionsVertical />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {actions?.map(({ id, content, ...itemProps }) => (
              <DropdownMenuItem key={id} {...itemProps}>
                {content}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      ) : null}
    </div>
  )
}

export default OrgMemberCardBase
