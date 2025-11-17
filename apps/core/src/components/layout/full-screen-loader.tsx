import { FC } from 'react'

import { cn } from '@repo/utils'

import Spinner from '@/components/general/spinner'

type Props = {
  className?: string
}

const FullScreenLoader: FC<Props> = ({ className }) => {
  return (
    <div className='fixed top-0 left-0 w-screen h-screen flex items-center justify-center z-[987654321]'>
      <div
        className={cn(
          'bg-black/30 absolute size-full animate-fadeIn',
          className,
        )}
      />
      <div className='p-3 rounded-full bg-primary/85 z-10 shadow-2xl animate-scaleIn'>
        <Spinner className='size-12 max-w-[25vw] fill-white' />
      </div>
    </div>
  )
}

export default FullScreenLoader
