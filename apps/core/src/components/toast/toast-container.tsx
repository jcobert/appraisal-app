'use client'

import { FC } from 'react'
import toast, { ToastBar, Toaster } from 'react-hot-toast'

import { Button } from '@repo/ui/ui/button'

const ToasterOven: FC = () => {
  return (
    <Toaster
      position='top-right'
      containerStyle={{ zIndex: 10987654321 }}
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
                      variant='ghost'
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
