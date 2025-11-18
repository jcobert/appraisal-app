import { Organization } from '@prisma/client'
import { useRouter } from 'next/navigation'
import { FC, useCallback, useMemo } from 'react'
import { Controller, SubmitHandler } from 'react-hook-form'
import { z } from 'zod'

import { Button } from '@repo/ui'

import { homeUrl } from '@/utils/nav'

import FormActionBar from '@/components/form/form-action-bar'
import TextInput from '@/components/form/inputs/text-input'
import Banner from '@/components/general/banner'
import Modal, { ModalProps } from '@/components/layout/modal'

import useZodForm from '@/hooks/use-zod-form'

import { useOrganizationMutations } from '@/features/organization/hooks/use-organization-mutations'

type Props = {
  organizationId: Organization['id']
  organizationName: Organization['name']
} & ModalProps

const conf2Text = 'delete organization'

const errorMap: z.ZodErrorMap = (issue, ctx) => {
  let msg = ctx.defaultError
  if (issue.code === 'invalid_literal') {
    msg = `Must match "${issue.expected}" exactly`
  }
  return { message: msg }
}

const DeleteOrgModal: FC<Props> = ({
  organizationId,
  organizationName,
  open,
  onOpenChange,
  ...modalProps
}) => {
  const router = useRouter()

  const { deleteOrganization } = useOrganizationMutations({ organizationId })

  const schema = useMemo(() => {
    return z.object({
      conf1: z.literal(organizationName, { errorMap }),
      conf2: z.literal(conf2Text as string, { errorMap }),
    })
  }, [organizationName])

  const { control, reset, handleSubmit } = useZodForm<z.infer<typeof schema>>(
    schema,
    {
      defaultValues: { conf1: '', conf2: '' },
    },
  )

  const onSubmit: SubmitHandler<z.infer<typeof schema>> =
    useCallback(async () => {
      await deleteOrganization.mutateAsync(
        {},
        {
          onSuccess: () => {
            router.replace(homeUrl(true))
          },
        },
      )
    }, [deleteOrganization, router])

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
      title='Delete Organization'
      {...modalProps}
    >
      <p className='text-pretty py-2'>
        This will delete the entire organization and all related data. You and
        any other members will no longer have access.
      </p>
      <form className='flex flex-col gap-6' onSubmit={handleSubmit(onSubmit)}>
        <div className='flex flex-col gap-8 -mx-6 border-y px-6 py-8 bg-gray-50'>
          <div>
            <p id='danger-zone-conf1-label' className='text-sm'>
              Type &quot;<b>{organizationName}&quot;</b> to confirm.
            </p>
            <Controller
              control={control}
              name='conf1'
              render={({ field, fieldState: { error } }) => (
                <TextInput
                  {...field}
                  id={`danger-zone-${field.name}`}
                  aria-labelledby='danger-zone-conf1-label'
                  error={error?.message}
                  applyErrorStateToLabel={false}
                  autoComplete='off'
                />
              )}
            />
          </div>
          <div>
            <p id='danger-zone-conf2-label' className='text-sm'>
              Type &quot;<b>{conf2Text}&quot;</b> to confirm.
            </p>
            <Controller
              control={control}
              name='conf2'
              render={({ field, fieldState: { error } }) => (
                <TextInput
                  {...field}
                  id={`danger-zone-${field.name}`}
                  aria-labelledby='danger-zone-conf2-label'
                  error={error?.message}
                  applyErrorStateToLabel={false}
                  autoComplete='off'
                />
              )}
            />
          </div>
        </div>

        <Banner variant='error'>{`Deleting ${organizationName} cannot be undone.`}</Banner>

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
            Delete Organization
          </Button>
        </FormActionBar>
      </form>
    </Modal>
  )
}

export default DeleteOrgModal
