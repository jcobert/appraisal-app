import { RefreshCcwIcon, XIcon } from 'lucide-react'
import { ComponentPropsWithoutRef, ReactNode, forwardRef } from 'react'

import {
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/ui'
import { cn } from '@repo/utils'

import FieldError from '@/components/form/field-error'
import FieldHelper from '@/components/form/field-helper'
import FieldLabel, { FieldLabelProps } from '@/components/form/field-label'
import { AdditionalInputProps } from '@/components/form/inputs/text-input'

type SelectRootProps = Omit<ComponentPropsWithoutRef<typeof Select>, 'children'>
type SelectTriggerProps = Omit<
  ComponentPropsWithoutRef<typeof SelectTrigger>,
  'children'
>
type SelectContentProps = Omit<
  ComponentPropsWithoutRef<typeof SelectContent>,
  'children'
>

export type SelectOption<
  T extends ReactNode = string,
  U extends ReactNode = ReactNode,
> = {
  value: T
  label: U
}

// type FormatValue<TOption extends SelectOption = SelectOption> = (
//   option: TOption,
// ) => ReactNode

export type SelectInputProps = Omit<
  SelectRootProps,
  'children' | 'onValueChange'
> &
  Omit<
    AdditionalInputProps,
    'icon' | 'inputClassName' | 'labelClassName' | 'helperMode'
  > & {
    options: SelectOption[]
    onChange?: SelectRootProps['onValueChange']
    portal?: SelectContentProps['portal']
    className?: string
    labelProps?: FieldLabelProps
    triggerProps?: SelectTriggerProps
    contentProps?: Omit<SelectContentProps, 'portal'>
    /** When true, selected value will display as option value instead of label. */
    displayValue?: boolean
    clearable?: boolean
  } & Pick<SelectTriggerProps, 'id'>

const SelectInput = forwardRef<HTMLButtonElement, SelectInputProps>(
  (
    {
      label,
      helper,
      className,
      error,
      tooltip,
      options,
      onChange,
      id,
      name,
      portal,
      labelProps,
      triggerProps,
      contentProps,
      displayValue,
      required = false,
      clearable = false,
      ...rootProps
    },
    ref,
  ) => {
    const inputId = id || name

    // const isClearable = !required && clearable !== false ? true : !!clearable

    return (
      <div className={cn(['flex flex-col gap-1', className])}>
        <FieldLabel
          htmlFor={inputId}
          required={required}
          disabled={rootProps?.disabled}
          error={!!error}
          tooltip={tooltip}
          {...labelProps}
        >
          {label}
        </FieldLabel>

        <div className='flex items-center'>
          <Select name={name} onValueChange={onChange} {...rootProps}>
            <SelectTrigger
              ref={ref}
              id={inputId}
              name={name}
              {...triggerProps}
              className={cn(
                'border-gray-300 dark:border-gray-500 [&:not(:disabled)]:hover:border-gray-400 disabled:text-gray-500 transition rounded disabled:cursor-not-allowed',
                rootProps?.disabled && 'bg-[#EFEFEF4D]',
                error && 'border-red-500',
                triggerProps?.className,
              )}
            >
              <SelectValue className='text-sm' placeholder='Select...'>
                {displayValue ? rootProps.value : undefined}
              </SelectValue>
            </SelectTrigger>
            <SelectContent portal={portal} {...contentProps}>
              {options?.map((opt) => (
                <SelectItem key={opt?.value} value={opt?.value}>
                  {opt?.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {clearable && !!rootProps.value ? (
            <Button
              variant='minimal'
              size='icon-sm'
              className='text-muted-foreground hover:text-accent-foreground ml-2 size-4'
              onClick={() => {
                onChange?.('')
              }}
              disabled={!rootProps.value}
            >
              <span className='sr-only'>{`Clear ${label} value.`}</span>
              <XIcon aria-hidden className='size-full' />
            </Button>
          ) : null}
        </div>

        {helper ? <FieldHelper text={helper} /> : null}
        <FieldError error={error} />
      </div>
    )
  },
)

export default SelectInput
