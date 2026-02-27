import { FC, PropsWithChildren } from 'react'

import { cn } from '@repo/utils'

import SectionHeading, {
  SectionHeadingProps,
} from '@/features/organization/settings/section-heading'

type Props = {
  wrapperClassName?: string
  className?: string
} & Partial<Pick<SectionHeadingProps, 'title' | 'subtitle'>>

const FormSection: FC<PropsWithChildren<Props>> = ({
  children,
  wrapperClassName,
  className,
  title,
  subtitle,
}) => {
  return (
    <div className={cn('flex flex-col gap-4', wrapperClassName)}>
      {title ? <SectionHeading title={title} subtitle={subtitle} /> : null}
      <div
        className={cn(
          'grid grid-cols-1 gap-x-14 gap-y-8 md:grid-cols-3',
          className,
        )}
      >
        {children}
      </div>
    </div>
  )
}

export default FormSection
