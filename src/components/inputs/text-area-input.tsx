'use client'

import { TextareaHTMLAttributes, forwardRef, useState } from 'react'

import { cn } from '@/utils/style'

import { AdditionalInputProps } from '@/components/inputs/text-input'

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

        <textarea
          className={cn([
            'w-full px-[0.875rem] py-2 min-h-fit border border-gray-300 hover:border-slate-400 transition rounded',
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
            setHelperVisible(true)
          }}
          onBlurCapture={() => {
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

export default TextAreaInput
