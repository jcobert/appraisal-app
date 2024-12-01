import { FC, ReactNode } from 'react'

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
    <div className='flex flex-col w-full gap-2__ text-center prose text-balance mx-auto'>
      <div className='flex flex-col items-center gap-1 font-medium'>
        {title ? <span className='text-lg'>{title}</span> : null}
        {subtitle ? <span>{subtitle}</span> : null}
      </div>

      {description ? <p className='text-pretty'>{description}</p> : null}

      {actions ?? null}
    </div>
  )
}

export default NoResults
