import Link, { LinkProps } from 'next/link'
import React, { FC } from 'react'
import { IoIosArrowBack } from 'react-icons/io'

import { cn } from '@/utils/style'

type Props = {
  text?: string
  className?: string
} & LinkProps

const Back: FC<Props> = ({ text = 'Back', className = '', ...props }) => {
  return (
    <Link
      className={cn(
        'flex items-center gap-1 w-fit group font-medium self-start print:hidden',
        className,
      )}
      {...props}
    >
      <IoIosArrowBack className='group-hover:text-dark-gray transition' />
      <span className='group-hover:text-dark-gray transition'>{text}</span>
    </Link>
  )
}

export default Back
