import { upperFirst } from 'lodash'
import { FC, useMemo, useState } from 'react'
import { Controller, SubmitHandler } from 'react-hook-form'
import { z } from 'zod'

import { successful } from '@/utils/fetch'

import FieldError from '@/components/form/field-error'
import FieldLabel from '@/components/form/field-label'
import FormActionBar from '@/components/form/form-action-bar'
import TextInput from '@/components/form/inputs/text-input'
import Button from '@/components/general/button'
import FullScreenLoader from '@/components/layout/full-screen-loader'
import Modal, { ModalProps } from '@/components/layout/modal'

import { useDisableInteraction } from '@/hooks/use-disable-interaction'
import useZodForm from '@/hooks/use-zod-form'

import { useOrganizationInvite } from '@/features/organization/hooks/use-organization-invite'
import { DetailedOrganization } from '@/features/organization/types'
import { ORG_MEMBER_ROLES } from '@/features/organization/utils'

type Props = {
  organization: DetailedOrganization | null | undefined
} & ModalProps

const formSchema = z.object({
  firstName: z.string().nonempty(),
  lastName: z.string().nonempty(),
  email: z.string().email(),
  roles: z.array(z.enum(ORG_MEMBER_ROLES)).min(1, 'Select at least one role'),
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
    [organization?.members],
  )

  const { control, handleSubmit, reset } = useZodForm<MemberInviteFormData>(
    schema,
    {
      defaultValues: { email: '', firstName: '', lastName: '', roles: [] },
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
        description='A form for inviting a new member to this organization.'
        preventOutsideClose
        trigger={<Button variant='secondary'>Add member</Button>}
      >
        <form
          onSubmit={handleSubmit(onSubmit)}
          className='flex flex-col gap-4 gap-y-6'
        >
          <div className='flex gap-4 gap-y-6 max-sm:flex-col'>
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
                icon='mail'
                placeholder='johnsmith@example.com'
                required
              />
            )}
          />

          <Controller
            control={control}
            name='roles'
            render={({
              field: { value, onChange, name, ref },
              fieldState: { error },
            }) => {
              return (
                <fieldset>
                  <FieldLabel
                    as='legend'
                    required
                    error={!!error}
                    className='mb-1'
                  >
                    Roles
                  </FieldLabel>
                  <div className='flex flex-col gap-2 max-sm:gap-6 border border-gray-300 dark:border-gray-500 rounded w-full sm:w-[calc(50%-0.5rem)] p-2 max-sm:p-4'>
                    {ORG_MEMBER_ROLES?.map((role, i) => {
                      const id = `${name}-${role}`
                      return (
                        <div
                          key={role}
                          className='grid grid-cols-6 grid-flow-row gap-2 items-center'
                        >
                          <FieldLabel
                            htmlFor={id}
                            className='col-span-2 font-medium'
                          >
                            {upperFirst(role)}
                          </FieldLabel>
                          <input
                            ref={i === 0 ? ref : undefined}
                            id={id}
                            type='checkbox'
                            className='size-4 max-sm:size-5'
                            value={role}
                            onChange={(e) => {
                              const remove = !e.target.checked
                              const newVal = remove
                                ? value?.filter((r) => r !== role)
                                : value?.concat(role)
                              onChange(newVal)
                            }}
                          />
                        </div>
                      )
                    })}
                  </div>
                  <FieldError error={error?.message} />
                </fieldset>
              )
            }}
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
