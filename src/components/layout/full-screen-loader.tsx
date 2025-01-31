import { FC } from 'react'

import Spinner from '@/components/general/spinner'

type Props = {
  //
}

const FullScreenLoader: FC<Props> = () => {
  return (
    <div className='fixed top-0 left-0 w-screen h-screen flex items-center justify-center'>
      <div className='bg-black/30 absolute size-full animate-fadeIn' />
      <div className='p-3 rounded-full bg-brand/85 z-10 shadow-2xl animate-scaleIn'>
        <Spinner className='size-20 max-w-[25vw] fill-white' />
      </div>
    </div>
  )
}

export default FullScreenLoader
