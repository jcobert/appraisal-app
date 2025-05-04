'use client'

import { FC } from 'react'
import toast, { ToastBar, Toaster } from 'react-hot-toast'

import Button from '@/components/general/button'

const ToasterOven: FC = () => {
  return (
    <Toaster
      position='top-right'
      toastOptions={{ success: { duration: 4000 } }}
    >
      {(t) => (
        <ToastBar
          toast={t}
          // style={{ maxWidth: 'none' }}
        >
          {({ icon, message }) => {
            return (
              <div className='flex items-center justify-between gap-2 size-full'>
                <div className='flex items-center'>
                  <span>{icon}</span>
                  <span className='text-pretty'>{message}</span>
                </div>
                {t.type !== 'loading' ? (
                  <div className='border-l border-gray-200 pl-2 h-full'>
                    <Button
                      variant='tertiary'
                      color='general'
                      className='max-sm:px-1 min-w-0 flex-none h-full'
                      onClick={() => toast.dismiss(t.id)}
                    >
                      Dismiss
                    </Button>
                  </div>
                ) : null}
              </div>
            )
          }}
        </ToastBar>
      )}
    </Toaster>
  )
}

export default ToasterOven
