import { FC } from 'react'

import { cn } from '@/utils/style'

export type HeadingProps = {
  text?: string
  className?: string
}

const Heading: FC<HeadingProps> = ({ text = '', className = '' }) => {
  return (
    <h1
      className={cn([
        'text-3xl sm:text-4xl font-bold text-center md:text-left py-2 text-balance text-brand',
        className,
      ])}
    >
      {text}
    </h1>
  )
}

export default Heading
