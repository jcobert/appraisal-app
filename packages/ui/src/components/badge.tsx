import { type VariantProps, cva } from 'class-variance-authority'
import * as React from 'react'

import { cn } from '@repo/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80',
        // secondary:
        //   'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80',
        // destructive:
        //   'border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/80',
        // outline: 'text-foreground',

        success:
          'dark:text-primary-foreground bg-emerald-50 border-emerald-200 ',
        neutral: 'dark:text-primary-foreground bg-gray-100 border-gray-200',
        failure: 'dark:text-primary-foreground bg-rose-50 border-rose-200',
        warning: 'dark:text-primary-foreground bg-orange-50 border-orange-200',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
