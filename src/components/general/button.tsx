import { ComponentPropsWithRef, forwardRef } from 'react'

import { cn } from '@/utils/style'

type StyleVariant = 'primary' | 'secondary' | 'tertiary'

export type ButtonProps = ComponentPropsWithRef<'button'> & {
  variant?: StyleVariant
  unstyled?: boolean
}

const variantClassNames: { [x in StyleVariant]: string } = {
  primary: 'btn',
  secondary: 'btn-outline',
  tertiary: 'btn-text',
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      className = '',
      type = 'button',
      unstyled = false,
      ...props
    },
    ref,
  ) => {
    const defaultStyle =
      variantClassNames?.[variant] || variantClassNames?.primary

    return (
      <>
        <button
          className={cn([
            !unstyled && defaultStyle,
            'flex items-center',
            className,
          ])}
          type={type}
          {...props}
          ref={ref}
        >
          {children}
        </button>
      </>
    )
  },
)

export default Button
