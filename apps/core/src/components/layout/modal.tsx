'use client'

import { ComponentPropsWithoutRef, ReactNode, forwardRef } from 'react'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@repo/ui'
import { cn } from '@repo/utils'

import { useIsMobile } from '@/hooks/use-mobile'

type DialogProps = ComponentPropsWithoutRef<typeof Dialog>
type DrawerProps = ComponentPropsWithoutRef<typeof Drawer>

export type ModalProps = {
  children?: ReactNode
  trigger?: ReactNode
  className?: string
  title?: ReactNode
  description?: string
  preventOutsideClose?: boolean
  /** `Dialog` root props. */
  desktopProps?: Omit<DialogProps, 'children'>
  /** `Drawer` root props. */
  mobileProps?: Omit<DrawerProps, 'children'>
} & Omit<DialogProps, 'children'>

// Cleans up any focus lock conflict on close.
// Nested elements like <SelectInput> that are also controlling focus lock
// might not clear body style if modal closes while it's still open.
// A hacky solution but keeping in place until a better one is found.
const clearModalLock = () => {
  document.body.style.pointerEvents = ''
}

const Modal = forwardRef<HTMLDivElement, ModalProps>(
  (
    {
      children,
      trigger,
      className,
      title,
      description,
      preventOutsideClose = false,
      desktopProps,
      mobileProps,
      ...commonRootProps
    },
    ref,
  ) => {
    const isMobile = useIsMobile()

    if (isMobile) {
      return (
        <Drawer {...commonRootProps} {...(mobileProps as DrawerProps)}>
          {trigger ? <DrawerTrigger asChild>{trigger}</DrawerTrigger> : null}
          <DrawerContent
            ref={ref}
            onCloseAutoFocus={() => {
              clearModalLock()
            }}
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
            className={cn('p-6 pt-0', className)}
          >
            <DrawerHeader>
              <DrawerTitle>{title}</DrawerTitle>
              <DrawerDescription className='sr-only'>
                {description}
              </DrawerDescription>
            </DrawerHeader>
            {children}
          </DrawerContent>
        </Drawer>
      )
    }

    return (
      <Dialog {...commonRootProps} {...desktopProps}>
        {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
        <DialogContent
          ref={ref}
          onCloseAutoFocus={() => {
            clearModalLock()
          }}
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
    )
  },
)

export default Modal
