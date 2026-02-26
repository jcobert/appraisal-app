'use client'

import { forwardRef } from 'react'

import NumberInput, {
  NumberInputProps,
} from '@/components/form/inputs/number-input'

export type CurrencyInputProps = Omit<
  NumberInputProps,
  | 'prefix'
  | 'thousandSeparator'
  | 'decimalSeparator'
  | 'decimalScale'
  | 'fixedDecimalScale'
  | 'onValueChange'
>

const CurrencyInput = forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ onChange, ...props }, ref) => {
    return (
      <NumberInput
        prefix='$'
        thousandSeparator=','
        decimalSeparator='.'
        decimalScale={2}
        fixedDecimalScale
        placeholder='$'
        {...props}
        onValueChange={(values) => {
          // Extract numeric value for form integration
          if (onChange) {
            const numericValue = values.floatValue ?? null
            onChange(numericValue as any)
          }
        }}
        ref={ref}
      />
    )
  },
)

CurrencyInput.displayName = 'CurrencyInput'

export default CurrencyInput
