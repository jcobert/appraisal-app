'use client'

import { format } from 'date-fns'
import { forwardRef, useState } from 'react'
import DatePicker, { DatePickerProps } from 'react-datepicker'
import { LuCalendarDays } from 'react-icons/lu'

import { cn } from '@/utils/style'

import { AdditionalInputProps } from '@/components/inputs/text-input'

import 'react-datepicker/dist/react-datepicker.css'

export type DateInputProps = DatePickerProps & AdditionalInputProps

const DEFAULT_DATE_FORMAT = 'yyyy-MM-dd'

const DateInput = forwardRef<DatePicker, DateInputProps>(
  (
    {
      id,
      name,
      selected,
      label,
      helper,
      error,
      className,
      labelClassName,
      inputClassName,
      ...props
    },
    ref,
  ) => {
    const [helperVisible, setHelperVisible] = useState(false)

    return (
      <div className={cn(['flex flex-col', className])}>
        <label
          htmlFor={id || name}
          className={cn([
            'text-sm text-gray-700 w-fit',
            props?.required &&
              "after:content-['*'] after:ml-[0.125rem] after:text-red-400",
            error && 'text-red-500',
            labelClassName,
          ])}
        >
          {label}
        </label>

        <DatePicker
          id={id || name}
          name={name}
          selected={selected}
          dateFormat={DEFAULT_DATE_FORMAT}
          showMonthDropdown
          showYearDropdown
          dropdownMode='select'
          showIcon
          icon={<LuCalendarDays className='mt-1 text-gray-500' width={12} />}
          placeholderText='mm/dd/yyyy'
          shouldCloseOnSelect
          customInput={
            <div
              className={cn(
                'w-full min-w-[18ch] h-10 px-8 py-2 border bg-white border-gray-300 hover:border-gray-400 transition rounded',
                error && 'border-red-500 hover:border-red-500',
                [inputClassName],
              )}
            >
              {selected ? (
                <span>{format(selected, 'MM/dd/yyyy')}</span>
              ) : (
                <span className='text-gray-400'>Select a date...</span>
              )}
            </div>
          }
          isClearable
          clearButtonClassName='bg-red-500'
          popperClassName='!z-[100]'
          {...props}
          ref={ref}
          onFocus={() => {
            setHelperVisible(true)
          }}
          onBlur={() => {
            setHelperVisible(false)
          }}
        />

        {helperVisible && helper ? (
          <span className='text-xs text-gray-600'>{helper}</span>
        ) : null}
        {error ? <span className='text-red-500 text-xs'>{error}</span> : null}
      </div>
    )
  },
)

export default DateInput
