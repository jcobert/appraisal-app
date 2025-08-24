import { MemberRole } from '@prisma/client'
import { upperFirst } from 'lodash'
import { forwardRef } from 'react'
import { ControllerFieldState, ControllerRenderProps } from 'react-hook-form'
import { FiInfo } from 'react-icons/fi'

import { cn } from '@/lib/utils'

import FieldError from '@/components/form/field-error'
import FieldLabel from '@/components/form/field-label'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

import MemberRoleDescriptions from '@/features/organization/common/member-role-descriptions'
import { ORG_MEMBER_ROLES } from '@/features/organization/utils'

type Props = {
  className?: string
  disabled?: boolean | ((role: MemberRole) => boolean)
  required?: boolean
} & Omit<
  ControllerRenderProps<{ roles: MemberRole[] }, 'roles'>,
  'ref' | 'disabled'
> &
  Pick<ControllerFieldState, 'error'>

const MemberRoleFieldset = forwardRef<HTMLInputElement, Props>(
  ({ value, onChange, error, disabled, name, required, className }, ref) => {
    return (
      <fieldset className={className}>
        <div className='flex items-center gap-2 mb-1'>
          <FieldLabel as='legend' required={required} error={!!error}>
            Roles
          </FieldLabel>
          <Popover>
            <PopoverTrigger>
              <FiInfo className='text-white text-2xl shrink-0 fill-blue-500' />
            </PopoverTrigger>
            <PopoverContent className='w-full max-w-[90vw] md:max-w-prose'>
              <MemberRoleDescriptions />
            </PopoverContent>
          </Popover>
        </div>
        <div
          className={cn(
            'flex flex-col gap-2 max-sm:gap-6 border border-gray-300 dark:border-gray-500 rounded w-full sm:w-[calc(50%-0.5rem)] p-2 max-sm:p-4',
            !!error && 'border-destructive',
          )}
        >
          {ORG_MEMBER_ROLES?.map((role, i) => {
            const id = `${name}-${role}`
            const isChecked = value?.includes(role)
            const isDisabled =
              typeof disabled === 'boolean' ? disabled : !!disabled?.(role)
            return (
              <div
                key={role}
                className='grid grid-cols-8 sm:grid-cols-6 grid-flow-row gap-2 sm:gap-8 items-center'
              >
                <FieldLabel htmlFor={id} className='col-span-2 font-medium'>
                  {upperFirst(role)}
                </FieldLabel>
                <input
                  ref={i === 0 ? ref : undefined}
                  id={id}
                  type='checkbox'
                  className={cn(
                    'size-4 max-sm:size-5',
                    isDisabled && 'cursor-not-allowed',
                  )}
                  value={role}
                  checked={isChecked}
                  onChange={(e) => {
                    const remove = !e.target.checked
                    const newVal = remove
                      ? value?.filter((r) => r !== role)
                      : value?.concat(role)
                    onChange(newVal)
                  }}
                  disabled={isDisabled}
                />
              </div>
            )
          })}
        </div>
        <FieldError error={error?.message} />
      </fieldset>
    )
  },
)

export default MemberRoleFieldset
