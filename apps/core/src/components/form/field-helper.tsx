import { upperFirst } from 'lodash'
import { FC } from 'react'

import { cn } from '@repo/utils'

type Props = {
  text?: string
  className?: string
}

const FieldHelper: FC<Props> = ({ text, className }) => {
  if (!text) return null
  return (
    <span className={cn('text-xs text-gray-600 text-pretty', className)}>
      {upperFirst(text)}
    </span>
  )
}

export default FieldHelper
