'use client'

import { format } from 'date-fns'
import { forwardRef } from 'react'

import {
  Button,
  Calendar,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@repo/ui'
import { cn } from '@repo/utils'

import FieldLabel from '@/components/form/field-label'
import { TextInputProps } from '@/components/form/inputs/text-input'

export type DateInputProps = Omit<TextInputProps, 'value' | 'onChange'> & {
  value: Date | null | undefined
  onChange: (value: Date | null | undefined) => void
}

const DateInput = forwardRef<HTMLButtonElement, DateInputProps>(
  (
    {
      value,
      onChange,
      id,
      name,
      label,
      labelClassName,
      className,
      required,
      error,
      applyErrorStateToLabel,
      icon,
      tooltip,
      ...props
    },
    ref,
  ) => {
    const currentValue = value || undefined

    return (
      <div className={cn('flex flex-col gap-1', className)}>
        <FieldLabel
          htmlFor={id || name}
          required={required}
          disabled={props?.disabled}
          error={!!error && applyErrorStateToLabel}
          className={labelClassName}
          icon={icon}
          tooltip={tooltip}
        >
          {label}
        </FieldLabel>

        <Popover>
          <PopoverTrigger asChild ref={ref}>
            <Button
              id={id || name}
              variant='outline'
              className='justify-start font-normal'
            >
              {value ? format(value, 'PPP') : <span>Pick a date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className='w-auto p-0' align='start'>
            <Calendar
              mode='single'
              selected={currentValue}
              onSelect={(selectedDate) => {
                onChange(selectedDate)
              }}
              defaultMonth={currentValue}
            />
          </PopoverContent>
        </Popover>
      </div>
    )
  },
)

export default DateInput
