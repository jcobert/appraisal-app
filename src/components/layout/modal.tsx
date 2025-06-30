import * as Dialog from '@radix-ui/react-dialog'
import { FC, ReactNode } from 'react'
import { CgClose } from 'react-icons/cg'

import { cn } from '@/utils/style'

export type ModalProps = {
  children?: ReactNode
  trigger?: ReactNode
  closeButton?: boolean
  className?: string
  title?: ReactNode
  description?: string
  titleClassName?: string
  preventOutsideClose?: boolean
} & Pick<Dialog.DialogProps, 'open' | 'onOpenChange'>

const Modal: FC<ModalProps> = ({
  children,
  trigger,
  open,
  onOpenChange,
  closeButton = true,
  className = '',
  title,
  description,
  titleClassName,
  preventOutsideClose = false,
}) => {
  return (
    <>
      <Dialog.Root open={open} onOpenChange={onOpenChange} modal>
        {!!trigger && <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>}
        <Dialog.Portal>
          <Dialog.Overlay className='fixed inset-0 bg-black/60' />
          <Dialog.Content
            onInteractOutside={(e) => {
              if (preventOutsideClose) {
                e.preventDefault()
              }
            }}
            onEscapeKeyDown={(e) => {
              if (preventOutsideClose) {
                e.preventDefault()
              }
            }}
            className={cn([
              'fixed flex flex-col gap-4 -translate-x-1/2 -translate-y-1/2 overflow-auto top-1/2 left-1/2 w-full h-fit max-h-[70dvh] sm:w-[95vw] md:w-[80vw] lg:w-[75vw] xl:max-w-[50vw]__ max-w-2xl sm:max-h-[80dvh] shadow p-4 md:p-8 sm:rounded-md bg-almost-white dark:bg-zinc-700 z-50',
              className,
            ])}
          >
            <Dialog.Title
              className={cn([
                'w-full flex items-center text-balance font-semibold text-xl',
                titleClassName,
              ])}
            >
              <div className='flex-auto text-center ml-9'>{title}</div>
              {closeButton && (
                <Dialog.Close className='' aria-label='Close'>
                  <CgClose className='text-xl hover:text-gray-600 transition m-2 rounded' />
                </Dialog.Close>
              )}
            </Dialog.Title>
            <Dialog.Description className='sr-only'>
              {description}
            </Dialog.Description>
            {children}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  )
}

export default Modal
