import { FC, ReactNode } from 'react'

import { cn } from '@repo/utils'

type Props = {
  title?: string
  subtitle?: string
  description?: string
  actions?: ReactNode
}

const NoResults: FC<Props> = ({
  title = 'No results',
  subtitle = '',
  description = '',
  actions,
}) => {
  return (
    <div className='flex flex-col w-full text-center prose text-balance mx-auto'>
      <div className='flex flex-col items-center gap-1 font-medium'>
        {title ? <span className='text-lg'>{title}</span> : null}
        {subtitle ? <span>{subtitle}</span> : null}
      </div>

      {description ? <p className='text-balance'>{description}</p> : null}

      {actions ? (
        <div
          className={cn('flex justify-center gap-6', !description && 'mt-6')}
        >
          {actions}
        </div>
      ) : null}
    </div>
  )
}

export default NoResults
