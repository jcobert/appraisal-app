'use client'

import { InputHTMLAttributes, forwardRef, useState } from 'react'

import { cn } from '@/utils/style'

import FieldError from '@/components/form/field-error'
import FieldHelper from '@/components/form/field-helper'
import FieldLabel, {
  FieldLabelProps,
  InputIcon,
} from '@/components/form/field-label'

export type AdditionalInputProps = {
  label?: string
  helper?: string
  helperMode?: 'focus' | 'always'
  error?: string
  icon?: InputIcon
  labelClassName?: string
  inputClassName?: string
} & Pick<FieldLabelProps, 'tooltip'>

export type TextInputProps = Partial<InputHTMLAttributes<HTMLInputElement>> &
  AdditionalInputProps

const TextInput = forwardRef<HTMLInputElement, TextInputProps>(
  (
    {
      type = 'text',
      id,
      name,
      label,
      placeholder,
      helper,
      helperMode = 'always',
      error,
      className,
      labelClassName,
      inputClassName,
      required,
      icon,
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
          icon={icon}
          tooltip={tooltip}
        >
          {label}
        </FieldLabel>

        <input
          aria-required={required}
          className={cn([
            'w-full h-10 px-[0.875rem] py-2 border border-gray-300 dark:border-gray-500 [&:not(:disabled)]:hover:border-gray-400 disabled:text-gray-500 transition rounded disabled:cursor-not-allowed',
            !!icon && 'pl-9',
            error && 'border-red-500 hover:border-red-500',
            inputClassName,
          ])}
          type={type}
          id={id || name}
          name={name}
          placeholder={placeholder}
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

export default TextInput
