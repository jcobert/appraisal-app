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
} & Pick<DialogProps, 'open' | 'onOpenChange'>

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
