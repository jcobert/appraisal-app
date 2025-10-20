import { upperFirst } from 'lodash'
import { FC } from 'react'

import { cn } from '@/utils/style'

type Props = {
  error?: string
  className?: string
}

const FieldError: FC<Props> = ({ error, className }) => {
  if (!error) return null
  return (
    <span className={cn('text-red-500 text-xs', className)}>
      {upperFirst(error)}
    </span>
  )
}

export default FieldError
