import { FC, useCallback, useMemo } from 'react'
import { Controller, SubmitHandler } from 'react-hook-form'
import { z } from 'zod'

import { Organization } from '@repo/database'
import { Button } from '@repo/ui/ui/button'

import FormActionBar from '@/components/form/form-action-bar'
import TextInput from '@/components/form/inputs/text-input'
import Banner from '@/components/general/banner'
import Modal, { ModalProps } from '@/components/layout/modal'

import useZodForm from '@/hooks/use-zod-form'

type Props = {
  organizationId: Organization['id']
  organizationName: Organization['name']
} & ModalProps

const errorMap: z.ZodErrorMap = (issue, ctx) => {
  let msg = ctx.defaultError
  if (issue.code === 'invalid_literal') {
    msg = `Must match "${issue.expected}" exactly`
  }
  return { message: msg }
}

const LeaveOrgModal: FC<Props> = ({
  organizationId,
  organizationName,
  open,
  onOpenChange,
  ...modalProps
}) => {
  const schema = useMemo(() => {
    return z.object({
      conf: z.literal(organizationName, { errorMap }),
    })
  }, [organizationName])

  const { control, reset, handleSubmit } = useZodForm<z.infer<typeof schema>>(
    schema,
    {
      defaultValues: {
        conf: '',
      },
    },
  )

  const onSubmit: SubmitHandler<z.infer<typeof schema>> =
    useCallback(async () => {}, [])

  return (
    <Modal
      preventOutsideClose={false}
      open={open}
      onOpenChange={(open) => {
        if (open) {
          reset()
        }
        onOpenChange?.(open)
      }}
      title='Leave Organization'
      {...modalProps}
    >
      {/* <p className='text-pretty py-2'></p> */}
      <form className='flex flex-col gap-6' onSubmit={handleSubmit(onSubmit)}>
        <div className='flex flex-col gap-8 -mx-6 border-y px-6 py-8 bg-gray-50'>
          <div>
            <p id='leave-org-conf-label' className='text-sm'>
              To confirm type, &quot;<b>{organizationName}&quot;</b>
            </p>
            <Controller
              control={control}
              name='conf'
              render={({ field, fieldState: { error } }) => (
                <TextInput
                  {...field}
                  id={`leave-org-${field.name}`}
                  aria-labelledby='leave-org-conf-label'
                  error={error?.message}
                  applyErrorStateToLabel={false}
                />
              )}
            />
          </div>
        </div>

        <Banner variant='error'>{`You will no longer have access to ${organizationName}.`}</Banner>

        <FormActionBar className='justify-between'>
          <Button
            variant='outline'
            onClick={() => {
              onOpenChange?.(false)
            }}
          >
            Cancel
          </Button>
          <Button type='submit' variant='destructive' className='w-fit'>
            Leave Organization
          </Button>
        </FormActionBar>
      </form>
    </Modal>
  )
}

export default LeaveOrgModal
