import { FC, ReactNode } from 'react'
import { IconType } from 'react-icons'
import { FiAlertCircle, FiAlertTriangle, FiInfo } from 'react-icons/fi'

import { cn } from '@/utils/style'

export type BannerVariant = 'info' | 'warning' | 'error'

export const bannerIconMap = {
  info: FiInfo,
  warning: FiAlertTriangle,
  error: FiAlertCircle,
} satisfies {
  [key in BannerVariant]: IconType
}

type Props = {
  className?: string
  children?: ReactNode
  variant?: BannerVariant
}

const Banner: FC<Props> = ({ className, children, variant = 'info' }) => {
  const Icon = bannerIconMap[variant]
  return (
    <div
      className={cn(
        'flex gap-4 p-4 sm:px-6 items-center border rounded not-prose',
        {
          'bg-blue-50 dark:bg-blue-100 border-blue-300 dark:border-blue-500':
            variant === 'info',
          'bg-orange-50 dark:bg-orange-100 border-orange-300 dark:border-orange-500':
            variant === 'warning',
          'bg-red-100 border-red-500': variant === 'error',
        },
        className,
      )}
    >
      <Icon
        aria-hidden
        className={cn('shrink-0 text-xl', {
          'text-blue-500': variant === 'info',
          'text-orange-500': variant === 'warning',
          'text-red-500': variant === 'error',
        })}
      />
      {typeof children === 'string' ? (
        <p className='text-sm text-left text-pretty inline-block dark:text-almost-black'>
          {children}
        </p>
      ) : (
        children
      )}
    </div>
  )
}

export default Banner
