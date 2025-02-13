'use client'

import { forwardRef, useState } from 'react'
import { PatternFormat, PatternFormatProps } from 'react-number-format'

import { cn } from '@/utils/style'

import FieldError from '@/components/form/field-error'
import FieldHelper from '@/components/form/field-helper'
import {
  AdditionalInputProps,
  inputIconMap,
} from '@/components/form/inputs/text-input'

export type PatternInputProps = PatternFormatProps & AdditionalInputProps

const PatternInput = forwardRef<HTMLInputElement, PatternInputProps>(
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
      <div className={cn(['flex flex-col', className])}>
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
              ])}
            />
          ) : null}
        </label>

        <PatternFormat
          aria-required={required}
          className={cn([
            'w-full h-10 px-[0.875rem] py-2 border border-gray-300 [&:not(:disabled)]:hover:border-gray-400 disabled:text-gray-500 transition rounded',
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

export default PatternInput
