'use client'

import { InputHTMLAttributes, forwardRef, useState } from 'react'
import { IconType } from 'react-icons'
import { FiBriefcase, FiGlobe, FiMail, FiPhone, FiUser } from 'react-icons/fi'

import { cn } from '@/utils/style'

import FieldError from '@/components/form/field-error'
import FieldHelper from '@/components/form/field-helper'

export type InputIcon = 'mail' | 'phone' | 'web' | 'person' | 'briefcase'

export type AdditionalInputProps = {
  label?: string
  helper?: string
  error?: string
  icon?: InputIcon
  labelClassName?: string
  inputClassName?: string
}

export type TextInputProps = Partial<InputHTMLAttributes<HTMLInputElement>> &
  AdditionalInputProps

export const inputIconMap: { [x in InputIcon]: IconType } = {
  mail: FiMail,
  phone: FiPhone,
  web: FiGlobe,
  person: FiUser,
  briefcase: FiBriefcase,
}

const TextInput = forwardRef<HTMLInputElement, TextInputProps>(
  (
    {
      type = 'text',
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
            'text-sm text-gray-700 dark:text-gray-100 w-fit',
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
                'absolute mt-[0.675rem] ml-[0.625rem] text-lg text-gray-500 dark:text-gray-300',
                !label && 'mt-[1.95rem]',
                props?.disabled && 'cursor-not-allowed',
              ])}
            />
          ) : null}
        </label>

        <input
          aria-required={required}
          className={cn([
            'w-full h-10 px-[0.875rem] py-2 border border-gray-300 dark:border-gray-500 [&:not(:disabled)]:hover:border-gray-400 disabled:text-gray-500 transition rounded disabled:cursor-not-allowed',
            !!Icon && 'pl-9',
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

export default TextInput
