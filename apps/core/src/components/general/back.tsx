import Link, { LinkProps } from 'next/link'
import React, { FC } from 'react'
import { IoIosArrowBack } from 'react-icons/io'

import { Button } from '@repo/ui'
import { cn } from '@repo/utils'

type Props = {
  text?: string
  className?: string
} & LinkProps

const Back: FC<Props> = ({ text = 'Back', className = '', ...props }) => {
  return (
    <Button
      asChild
      variant='ghost'
      className={cn(
        'px-1',
        'flex items-center gap-1 w-fit group font-medium self-start print:hidden',
        className,
      )}
    >
      <Link {...props}>
        <IoIosArrowBack className='transition' />
        <span className='transition'>{text}</span>
      </Link>
    </Button>
  )
}

export default Back
