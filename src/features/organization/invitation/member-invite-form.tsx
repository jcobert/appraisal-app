import { FC, useMemo, useState } from 'react'
import { Controller, SubmitHandler } from 'react-hook-form'
import { z } from 'zod'

import { successful } from '@/utils/fetch'

import FormActionBar from '@/components/form/form-action-bar'
import TextInput from '@/components/form/inputs/text-input'
import Button from '@/components/general/button'
import FullScreenLoader from '@/components/layout/full-screen-loader'
import Modal, { ModalProps } from '@/components/layout/modal'

import { useDisableInteraction } from '@/hooks/use-disable-interaction'
import useZodForm from '@/hooks/use-zod-form'

import { useOrganizationInvite } from '@/features/organization/hooks/use-organization-invite'
import { DetailedOrganization } from '@/features/organization/types'

type Props = {
  organization: DetailedOrganization | null | undefined
} & ModalProps

const formSchema = z.object({
  firstName: z.string().nonempty(),
  lastName: z.string().nonempty(),
  email: z.string().email(),
})

type MemberInviteFormData = z.infer<typeof formSchema>

const MemberInviteForm: FC<Props> = ({ organization }) => {
  const schema = useMemo(
    () =>
      formSchema.superRefine((data, ctx) => {
        if (
          (organization?.members || [])?.some(
            (mem) =>
              data?.email?.toLowerCase() === mem?.user?.email?.toLowerCase(),
          )
        ) {
          ctx.addIssue({
            path: ['email'],
            code: 'custom',
            message:
              'There is already a member of the organization with this email.',
          })
        }
      }),
    [organization?.id],
  )

  const { control, handleSubmit, reset } = useZodForm<MemberInviteFormData>(
    schema,
    {
      defaultValues: { email: '', firstName: '', lastName: '' },
    },
  )

  const { mutateAsync } = useOrganizationInvite({ organization })

  const onSubmit: SubmitHandler<MemberInviteFormData> = async (data) => {
    setIsBusy(true)
    const res = await mutateAsync(data)
    if (successful(res?.status)) {
      setFormOpen(false)
    }
    setIsBusy(false)
  }

  const [formOpen, setFormOpen] = useState(false)
  const [isBusy, setIsBusy] = useState(false)

  useDisableInteraction({ disable: isBusy })

  return (
    <>
      {isBusy ? <FullScreenLoader /> : null}
      <Modal
        open={formOpen}
        onOpenChange={(newOpen) => {
          setFormOpen(newOpen)
          reset()
          setIsBusy(false)
        }}
        title='Invite to Organization'
        preventOutsideClose
        trigger={<Button variant='secondary'>Add member</Button>}
      >
        <form onSubmit={handleSubmit(onSubmit)} className='flex flex-col gap-4'>
          <div className='flex gap-4 max-sm:flex-col'>
            <Controller
              control={control}
              name='firstName'
              render={({ field, fieldState: { error } }) => (
                <TextInput
                  {...field}
                  id={field.name}
                  label='First Name'
                  error={error?.message}
                  className='flex-1'
                  icon='person'
                  placeholder='First'
                  required
                />
              )}
            />
            <Controller
              control={control}
              name='lastName'
              render={({ field, fieldState: { error } }) => (
                <TextInput
                  {...field}
                  id={field.name}
                  label='Last Name'
                  error={error?.message}
                  className='flex-1'
                  icon='person'
                  placeholder='Last'
                  required
                />
              )}
            />
          </div>

          <Controller
            control={control}
            name='email'
            render={({ field, fieldState: { error } }) => (
              <TextInput
                {...field}
                id={field.name}
                label='Email'
                error={error?.message}
                className=''
                icon='mail'
                placeholder='johnsmith@example.com'
                required
              />
            )}
          />

          <FormActionBar className='mt-4'>
            <Button
              variant='secondary'
              onClick={() => {
                setFormOpen(false)
              }}
            >
              Cancel
            </Button>
            <Button
              type='submit'
              // loading={isBusy}
            >
              Send invitation
            </Button>
          </FormActionBar>
        </form>
      </Modal>
    </>
  )
}

export default MemberInviteForm
