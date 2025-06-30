'use client'

import { forwardRef, useState } from 'react'
import { NumericFormat, NumericFormatProps } from 'react-number-format'

import { cn } from '@/utils/style'

import FieldError from '@/components/form/field-error'
import FieldHelper from '@/components/form/field-helper'
import FieldLabel from '@/components/form/field-label'
import { AdditionalInputProps } from '@/components/form/inputs/text-input'

export type NumberInputProps = Partial<NumericFormatProps> &
  AdditionalInputProps

const NumberInput = forwardRef<HTMLInputElement, NumberInputProps>(
  (
    {
      id,
      name,
      label,
      placeholder,
      helper,
      error,
      className,
      labelClassName,
      inputClassName,
      required,
      icon,
      ...props
    },
    ref,
  ) => {
    const [helperVisible, setHelperVisible] = useState(false)

    return (
      <div className={cn(['flex flex-col gap-1', className])}>
        <FieldLabel
          htmlFor={id || name}
          required={required}
          disabled={props?.disabled}
          error={!!error}
          className={labelClassName}
          icon={icon}
        >
          {label}
        </FieldLabel>

        <NumericFormat
          aria-required={required}
          className={cn([
            'w-full h-10 px-[0.875rem] py-2 border border-gray-300 [&:not(:disabled)]:hover:border-gray-400 disabled:text-gray-500 transition rounded disabled:cursor-not-allowed',
            !!icon && 'pl-9',
            error && 'border-red-500 hover:border-red-500',
            inputClassName,
          ])}
          id={id || name}
          name={name}
          placeholder={placeholder}
          {...props}
          getInputRef={ref}
          onFocusCapture={() => {
            setHelperVisible(true)
          }}
          onBlurCapture={() => {
            setHelperVisible(false)
          }}
        />

        {helperVisible ? <FieldHelper text={helper} /> : null}
        <FieldError error={error} />
      </div>
    )
  },
)

export default NumberInput
