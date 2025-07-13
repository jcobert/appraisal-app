import { ComponentPropsWithoutRef, FC, ReactNode } from 'react'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

export type ModalProps = {
  children?: ReactNode
  trigger?: ReactNode
  className?: string
  title?: ReactNode
  description?: string
  preventOutsideClose?: boolean
} & Omit<ComponentPropsWithoutRef<typeof Dialog>, 'children'>

const Modal: FC<ModalProps> = ({
  children,
  trigger,
  className,
  title,
  description,
  preventOutsideClose = false,
  ...props
}) => {
  return (
    <>
      <Dialog {...props}>
        {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
        <DialogContent
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
          className={className}
        >
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription className='sr-only'>
              {description}
            </DialogDescription>
          </DialogHeader>
          {children}
        </DialogContent>
      </Dialog>
    </>
  )
}

export default Modal
