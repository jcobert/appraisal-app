import React, { FC, ReactNode, useState } from 'react'

import Button from '@/components/general/button'
import FormActionBar from '@/components/general/form-action-bar'
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
} & Pick<ModalProps, 'open' | 'onOpenChange'>

const Confirmation: FC<ConfirmationProps> = ({
  title,
  description,
  children,
  open,
  onOpenChange,
  onCancel,
  onConfirm,
  loader = 'button',
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
      >
        <div className='flex flex-col gap-6'>
          {description}
          <FormActionBar>
            <Button
              variant='secondary'
              onClick={() => {
                if (isBusy) return
                onCancel?.()
                handleOpen(false)
              }}
              disabled={isBusy}
            >
              Cancel
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
            >
              OK
            </Button>
          </FormActionBar>
        </div>
      </Modal>
    </>
  )
}

export default Confirmation
