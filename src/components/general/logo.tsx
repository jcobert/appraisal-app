import { FC, SVGAttributes } from 'react'
import { GrCodeSandbox } from 'react-icons/gr'

import { cn } from '@/utils/style'

type Props = SVGAttributes<SVGElement>

const Logo: FC<Props> = ({ className, ...rest }) => {
  return (
    <GrCodeSandbox
      className={cn('text-primary text-4xl transition', className)}
      {...rest}
    />
  )
}

export default Logo
