import { FC, ReactNode } from 'react'

import { cn } from '@/utils/style'

export type SectionHeadingProps = {
  title: ReactNode
  subtitle?: ReactNode
  className?: string
}

const SectionHeading: FC<SectionHeadingProps> = ({
  title,
  subtitle,
  className,
}) => {
  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <h2 className='font-semibold text-gray-900 dark:text-gray-50 text-balance'>
        {title}
      </h2>
      {subtitle ? (
        <p className='text-sm leading-6 text-muted-foreground text-pretty'>
          {subtitle}
        </p>
      ) : null}
    </div>
  )
}

export default SectionHeading
