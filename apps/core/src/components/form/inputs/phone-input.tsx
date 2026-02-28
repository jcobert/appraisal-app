'use client'

import { forwardRef } from 'react'

import PatternInput, {
  PatternInputProps,
} from '@/components/form/inputs/pattern-input'

export type PhoneInputProps = Omit<PatternInputProps, 'format' | 'mask'>

const PhoneInput = forwardRef<HTMLInputElement, PhoneInputProps>(
  (props, ref) => {
    return (
      <PatternInput
        icon='phone'
        placeholder='(123) 456-7890'
        format='(###) ###-####'
        mask='_'
        {...props}
        ref={ref}
      />
    )
  },
)

export default PhoneInput
