import { FC } from 'react'
import { ImSpinner2 } from 'react-icons/im'

import { cn } from '@/utils/style'

type Props = {
  className?: string
}

const Spinner: FC<Props> = ({ className }) => {
  return (
    <ImSpinner2 className={cn('size-6 animate-spin fill-brand', className)} />
  )
}

export default Spinner
