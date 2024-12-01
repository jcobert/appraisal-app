import * as AlertDialog from '@radix-ui/react-alert-dialog'
import { FC, ReactNode, useState } from 'react'

import Button from '@/components/common/button'

type Props = {
  title?: ReactNode
  description?: ReactNode
  cancel?: ReactNode
  onCancel?: () => void
  confirm?: ReactNode
  onConfirm?: () => void
  trigger?: ReactNode
  triggerWrapperClassName?: string
  triggerClassName?: string
  triggerDisabled?: boolean
  bypass?: boolean
}

const Alert: FC<Props> = ({
  title = 'Are you sure?',
  description = 'This action cannot be undone.',
  cancel = 'Never mind',
  confirm = "Yes, I'm sure",
  onCancel,
  onConfirm,
  trigger,
  triggerWrapperClassName,
  triggerClassName = 'btn-text',
  triggerDisabled = false,
  bypass = false,
}) => {
  const [open, setOpen] = useState(false)

  return (
    <AlertDialog.Root open={open} onOpenChange={setOpen}>
      <div className={triggerWrapperClassName}>
        {bypass ? (
          <Button
            className={triggerClassName}
            disabled={triggerDisabled}
            onClick={() => {
              onConfirm?.()
            }}
          >
            {trigger}
          </Button>
        ) : (
          <AlertDialog.Trigger
            className={triggerClassName}
            disabled={triggerDisabled}
          >
            {trigger}
          </AlertDialog.Trigger>
        )}
      </div>

      <AlertDialog.Portal>
        <AlertDialog.Overlay className='fixed inset-0 bg-black/70 h-[200vh] z-[9999]' />
        <AlertDialog.Content className='fixed top-1/2 left-1/2 max-h-[85vh] w-[90vw] max-w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-md bg-background shadow-lg p-6 z-[9999]'>
          <AlertDialog.Title className='text-lg font-medium'>
            {title}
          </AlertDialog.Title>
          <AlertDialog.Description className='mt-4 mb-12 text-gray-800'>
            {description}
          </AlertDialog.Description>

          <div className='flex max-sm:flex-col items-end justify-end gap-8'>
            <AlertDialog.Cancel asChild>
              <Button className='btn-outline' onClick={() => onCancel?.()}>
                {cancel}
              </Button>
            </AlertDialog.Cancel>
            <AlertDialog.Action asChild>
              <Button onClick={() => onConfirm?.()}>{confirm}</Button>
            </AlertDialog.Action>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  )
}

export default Alert
