'use client'

import { forwardRef, useState } from 'react'
import { NumericFormat, NumericFormatProps } from 'react-number-format'

import { cn } from '@/utils/style'

import FieldError from '@/components/form/field-error'
import FieldHelper from '@/components/form/field-helper'
import {
  AdditionalInputProps,
  inputIconMap,
} from '@/components/form/inputs/text-input'

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
      ...props
    },
    ref,
  ) => {
    const Icon = props?.icon ? inputIconMap?.[props.icon] : null

    const [helperVisible, setHelperVisible] = useState(false)

    return (
      <div className={cn(['flex flex-col gap-1', className])}>
        <label
          htmlFor={id || name}
          className={cn([
            'text-sm text-gray-700 w-fit',
            required &&
              "after:content-['*'] after:ml-[0.125rem] after:text-red-400",
            error && 'text-red-500',
            labelClassName,
          ])}
        >
          {label}
          {Icon ? (
            <Icon
              className={cn([
                'absolute mt-[0.675rem] ml-[0.625rem] text-lg text-gray-500',
                !label && 'mt-[1.95rem]',
                props?.disabled && 'cursor-not-allowed',
              ])}
            />
          ) : null}
        </label>

        <NumericFormat
          aria-required={required}
          className={cn([
            'w-full h-10 px-[0.875rem] py-2 border border-gray-300 [&:not(:disabled)]:hover:border-gray-400 disabled:text-gray-500 transition rounded disabled:cursor-not-allowed',
            !!Icon && 'pl-9',
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
