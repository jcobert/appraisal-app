import { FC } from 'react'

import { cn } from '@/utils/style'

type Props = {
  className?: string
}

const Separator: FC<Props> = ({ className }) => {
  return (
    <div
      aria-hidden
      className={cn(
        'h-px bg-gradient-to-r from-brand-extra-light/20 via-brand/15 to-brand-extra-light/20',
        className,
      )}
    />
  )
}

export default Separator
