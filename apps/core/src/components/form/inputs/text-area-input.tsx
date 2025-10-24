'use client'

import { TextareaHTMLAttributes, forwardRef, useState } from 'react'

import { cn } from '@/utils/style'

import FieldError from '@/components/form/field-error'
import FieldHelper from '@/components/form/field-helper'
import FieldLabel from '@/components/form/field-label'
import { AdditionalInputProps } from '@/components/form/inputs/text-input'

export type TextAreaInputProps = Partial<
  TextareaHTMLAttributes<HTMLTextAreaElement>
> &
  Omit<AdditionalInputProps, 'icon'>

const TextAreaInput = forwardRef<HTMLTextAreaElement, TextAreaInputProps>(
  (
    {
      id,
      name,
      label,
      placeholder,
      helper,
      helperMode = 'always',
      error,
      required,
      className,
      labelClassName,
      inputClassName,
      tooltip,
      ...props
    },
    ref,
  ) => {
    const [helperVisible, setHelperVisible] = useState(
      helperMode === 'always' ? true : false,
    )

    return (
      <div className={cn(['flex flex-col gap-1', className])}>
        <FieldLabel
          htmlFor={id || name}
          required={required}
          disabled={props?.disabled}
          error={!!error}
          className={labelClassName}
          tooltip={tooltip}
        >
          {label}
        </FieldLabel>

        <textarea
          aria-required={required}
          className={cn([
            'w-full px-[0.875rem] py-2 min-h-fit border border-gray-300 [&:not(:disabled)]:hover:border-gray-400 disabled:text-gray-500 transition rounded disabled:cursor-not-allowed',
            error && 'border-red-500 hover:border-red-500',
            inputClassName,
          ])}
          id={id || name}
          name={name}
          placeholder={placeholder}
          rows={3}
          {...props}
          ref={ref}
          onFocusCapture={() => {
            if (helperMode === 'focus') {
              setHelperVisible(true)
            }
          }}
          onBlurCapture={() => {
            if (helperMode === 'focus') {
              setHelperVisible(false)
            }
          }}
        />

        {helperVisible ? <FieldHelper text={helper} /> : null}
        <FieldError error={error} />
      </div>
    )
  },
)

export default TextAreaInput
