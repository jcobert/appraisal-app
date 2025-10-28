'use client'

import React, { FC, ReactNode, useState } from 'react'

import { Button, ButtonProps } from '@repo/ui/ui/button'

import FormActionBar from '@/components/form/form-action-bar'
import FullScreenLoader from '@/components/layout/full-screen-loader'
import Modal, { ModalProps } from '@/components/layout/modal'

import { useDisableInteraction } from '@/hooks/use-disable-interaction'

export type ConfirmationProps = {
  title?: ReactNode
  description?: ReactNode
  children?: ReactNode
  /** Run when cancel button is clicked. */
  onCancel?: () => void
  /**
   * Run when confirm button is clicked. Perform your async data operations here.
   * `closeModal` is provided as a callback function to close the modal (e.g. after successful request).
   */
  onConfirm?: ({
    closeModal,
  }: {
    closeModal: () => void
  }) => Promise<void> | void
  /** How to display loading indicator while `onConfirm` is running. Default is `"button"`. */
  loader?: 'fullscreen' | 'button' | 'none'
  primaryButtonText?: string
  cancelButtonText?: string
  primaryButtonProps?: ButtonProps
  cancelButtonProps?: ButtonProps
} & Pick<ModalProps, 'open' | 'onOpenChange' | 'preventOutsideClose'>

const Confirmation: FC<ConfirmationProps> = ({
  title,
  description,
  children,
  open,
  onOpenChange,
  onCancel,
  onConfirm,
  loader = 'button',
  preventOutsideClose = true,
  primaryButtonText = 'OK',
  cancelButtonText = 'Cancel',
  primaryButtonProps,
  cancelButtonProps,
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [isBusy, setIsBusy] = useState(false)

  const handleOpen = (newOpen: boolean) => {
    onOpenChange?.(newOpen)
    setIsOpen(newOpen)
  }

  useDisableInteraction({ disable: isBusy })

  return (
    <>
      {isBusy && loader === 'fullscreen' ? <FullScreenLoader /> : null}

      <Modal
        open={open ?? isOpen}
        onOpenChange={(newOpen) => {
          if (isBusy) return
          handleOpen(newOpen)
        }}
        title={title}
        trigger={children}
        preventOutsideClose={preventOutsideClose}
      >
        <div className='flex flex-col gap-6'>
          {description}
          <FormActionBar>
            <Button
              variant='outline'
              onClick={() => {
                if (isBusy) return
                onCancel?.()
                handleOpen(false)
              }}
              disabled={isBusy}
              {...cancelButtonProps}
            >
              {cancelButtonText}
            </Button>
            <Button
              onClick={async () => {
                setIsBusy(true)
                await onConfirm?.({
                  closeModal: () => {
                    handleOpen(false)
                  },
                })
                setIsBusy(false)
              }}
              loading={isBusy}
              disabled={isBusy}
              variant='destructive'
              {...primaryButtonProps}
            >
              {primaryButtonText}
            </Button>
          </FormActionBar>
        </div>
      </Modal>
    </>
  )
}

export default Confirmation
