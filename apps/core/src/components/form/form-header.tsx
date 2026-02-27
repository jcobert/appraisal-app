import { FC, PropsWithChildren } from 'react'

import { cn } from '@repo/utils'

type Props = PropsWithChildren<{
  className?: string
}>

const FormHeader: FC<Props> = ({ className, children }) => {
  return (
    <div
      className={cn(
        'sticky top-[calc(3rem+1px)] bg-muted p-4 shadow -mx-4 -mt-4 z-50',
        className,
      )}
    >
      {children}
    </div>
  )
}

export default FormHeader
