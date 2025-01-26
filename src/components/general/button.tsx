import { ComponentPropsWithRef, forwardRef } from 'react'

import { cn } from '@/utils/style'

import Spinner from '@/components/general/spinner'

type StyleVariant = 'primary' | 'secondary' | 'tertiary'

type Color = 'danger' | 'brand'

export type ButtonProps = ComponentPropsWithRef<'button'> & {
  variant?: StyleVariant
  color?: Color
  unstyled?: boolean
  loading?: boolean
}

const variantClassNames: { [x in StyleVariant]: string } = {
  primary: 'btn',
  secondary: 'btn-outline',
  tertiary: 'btn-text',
}

const colorClassNames: {
  [x in Color]: Partial<typeof variantClassNames>
} = {
  brand: {},
  danger: {
    primary:
      'border-rose-600 bg-rose-600 hover:bg-rose-700 disabled:border-rose-600/25 disabled:bg-rose-600/70',
    secondary:
      'border-rose-600 text-rose-600 hover:border-rose-700 [&:not(:disabled)]:hover:bg-rose-500/5 hover:text-rose-700 disabled:border-rose-600/25 disabled:text-rose-600/60',
    tertiary:
      'text-rose-600 hover:text-rose-700 disabled:text-rose-600/60 [&:not(:disabled)]:hover:bg-rose-600/5',
  },
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      color = 'brand',
      className = '',
      type = 'button',
      unstyled = false,
      loading = false,
      ...props
    },
    ref,
  ) => {
    const variantStyle =
      variantClassNames?.[variant] || variantClassNames?.primary

    const emphasisStyle = color ? colorClassNames?.[color]?.[variant] : ''

    return (
      <>
        <button
          className={cn([
            !unstyled && variantStyle,
            !unstyled && emphasisStyle,
            'flex items-center',
            className,
          ])}
          type={type}
          {...props}
          ref={ref}
        >
          {loading ? (
            <Spinner
              className={cn({
                'fill-almost-white': variant === 'primary',
                'fill-brand':
                  (variant === 'secondary' || variant === 'tertiary') &&
                  color === 'brand',
                'fill-rose-600':
                  (variant === 'secondary' || variant === 'tertiary') &&
                  color === 'danger',
              })}
            />
          ) : (
            children
          )}
        </button>
      </>
    )
  },
)

export default Button
