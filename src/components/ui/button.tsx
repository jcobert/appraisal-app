import { Slot } from '@radix-ui/react-slot'
import { type VariantProps, cva } from 'class-variance-authority'
import * as React from 'react'

import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default:
          'bg-primary text-primary-foreground shadow hover:bg-primary/90',
        destructive:
          'bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90',
        outline:
          'border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground',
        secondary:
          'bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
        minimal: 'text-primary hover:text-primary/90',
      },
      size: {
        default: 'h-9 px-4 py-2 min-w-32__',
        sm: 'h-8 rounded-md px-3 text-xs min-w-24__',
        lg: 'h-10 rounded-md px-8 min-w-32__',
        icon: 'h-9 w-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
    loading?: boolean
  }

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant, size, asChild = false, loading = false, ...props },
    ref,
  ) => {
    const Comp = asChild ? Slot : 'button'

    // {
    //   loading ? (
    //     <Spinner
    //       className={cn({
    //         'fill-almost-white': variant === 'primary',
    //         'fill-brand':
    //           (variant === 'secondary' || variant === 'tertiary') &&
    //           color === 'brand',
    //         'fill-rose-600':
    //           (variant === 'secondary' || variant === 'tertiary') &&
    //           color === 'danger',
    //       })}
    //     />
    //   ) : (
    //     children
    //   )
    // }

    return (
      <Comp
        ref={ref}
        type='button'
        className={cn(buttonVariants({ variant, size, className }))}
        {...props}
      />
    )
  },
)
Button.displayName = 'Button'

export { Button, buttonVariants }
