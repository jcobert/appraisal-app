'use client'

import { forwardRef } from 'react'
import DatePicker, { DatePickerProps } from 'react-datepicker'

import TextInput, {
  AdditionalInputProps,
} from '@/components/form/inputs/text-input'

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
      helperMode = 'always',
      error,
      className,
      labelClassName,
      inputClassName,
      tooltip,
      ...props
    },
    ref,
  ) => {
    return (
      <DatePicker
        id={id || name}
        name={name}
        selected={selected}
        dateFormat={DEFAULT_DATE_FORMAT}
        showMonthDropdown
        showYearDropdown
        dropdownMode='select'
        showIcon={false}
        placeholderText='mm/dd/yyyy'
        shouldCloseOnSelect
        isClearable
        clearButtonClassName='bg-red-500'
        popperClassName='!z-[100]'
        {...props}
        customInput={
          <TextInput
            label={label}
            icon='calendar'
            error={error}
            className={className}
            tooltip={tooltip}
            helper={helper}
            helperMode={helperMode}
            labelClassName={labelClassName}
            inputClassName={inputClassName}
            // value={selected ? format(selected, 'MM/dd/yyyy') : ''}
          />
        }
        ref={ref}
      />
    )
  },
)

export default DateInput
