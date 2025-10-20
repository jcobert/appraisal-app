import React, { FC } from 'react'

import { cn } from '@/utils/style'

type Props = {
  size?: 'xs' | 'sm' | 'md' | 'lg'
  className?: string
}

const LoadingDots: FC<Props> = ({ size = 'md', className = '' }) => {
  return (
    <span
      className={cn('inline-flex items-center gap-x-[2px]', {
        [className]: !!className,
      })}
    >
      <span
        className={cn(
          'bg-primary dark:bg-zinc-200 rounded-full inline-block animate-[blink_1.4s_infinite_both]',
          {
            'w-[3px] h-[3px]': size === 'sm',
            'w-[5px] h-[5px]': size === 'md',
            'w-[7px] h-[7px]': size === 'lg',
          },
        )}
      />
      <span
        className={cn(
          'bg-primary dark:bg-zinc-200 w-[5px] h-[5px] rounded-full inline-block animate-[blink_1.4s_infinite_200ms_both]',
          {
            'w-[3px] h-[3px]': size === 'sm',
            'w-[5px] h-[5px]': size === 'md',
            'w-[7px] h-[7px]': size === 'lg',
          },
        )}
      />
      <span
        className={cn(
          'bg-primary dark:bg-zinc-200 w-[5px] h-[5px] rounded-full inline-block animate-[blink_1.4s_infinite_400ms_both]',
          {
            'w-[3px] h-[3px]': size === 'sm',
            'w-[5px] h-[5px]': size === 'md',
            'w-[7px] h-[7px]': size === 'lg',
          },
        )}
      />
    </span>
  )
}

export default LoadingDots
