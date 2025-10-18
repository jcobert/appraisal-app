import { FC } from 'react'

import { cn } from '@repo/utils'

type Props = {
  className?: string
}

const Separator: FC<Props> = ({ className }) => {
  return (
    <div
      aria-hidden
      className={cn(
        'h-px bg-gradient-to-r from-brand-extra-light/20 via-primary/15 to-brand-extra-light/20',
        className,
      )}
    />
  )
}

export default Separator
