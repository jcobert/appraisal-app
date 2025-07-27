import { OrgInvitation } from '@prisma/client'
import { upperFirst } from 'lodash'
import { FC, useMemo, useState } from 'react'
import { Controller, SubmitHandler } from 'react-hook-form'
import { z } from 'zod'

import { orgMemberSchema } from '@/lib/db/schemas/org-member'

import { successful } from '@/utils/fetch'
import { formDefaults } from '@/utils/form'
import { toastyRequest } from '@/utils/toast'

import FieldError from '@/components/form/field-error'
import FieldLabel from '@/components/form/field-label'
import FormActionBar from '@/components/form/form-action-bar'
import TextInput from '@/components/form/inputs/text-input'
import FullScreenLoader from '@/components/layout/full-screen-loader'
import Modal, { ModalProps } from '@/components/layout/modal'
import { Button } from '@/components/ui/button'

import { useDisableInteraction } from '@/hooks/use-disable-interaction'
import useZodForm from '@/hooks/use-zod-form'

import { useOrganizationInvite } from '@/features/organization/hooks/use-organization-invite'
import { DetailedOrganization } from '@/features/organization/types'
import { ORG_MEMBER_ROLES } from '@/features/organization/utils'

type Props = {
  organization: Partial<DetailedOrganization> | null | undefined
  initialData?: Partial<OrgInvitation> | null
} & Required<Pick<ModalProps, 'open' | 'onOpenChange'>> &
  Partial<Omit<ModalProps, 'open' | 'onOpenChange'>>

const formSchema = orgMemberSchema.form

type MemberInviteFormData = z.infer<typeof formSchema>

const DEFAULT_FORM_VALUES = {
  email: '',
  firstName: '',
  lastName: '',
  roles: [],
} satisfies MemberInviteFormData

const MemberInviteForm: FC<Props> = ({
  organization,
  initialData,
  open,
  onOpenChange,
  ...modalProps
}) => {
  const isUpdate = !!initialData?.id

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
      defaultValues: formDefaults(DEFAULT_FORM_VALUES, {
        email: initialData?.inviteeEmail || DEFAULT_FORM_VALUES.email,
        firstName:
          initialData?.inviteeFirstName || DEFAULT_FORM_VALUES.firstName,
        lastName: initialData?.inviteeLastName || DEFAULT_FORM_VALUES.lastName,
        roles: initialData?.roles || DEFAULT_FORM_VALUES.roles,
      } as Partial<MemberInviteFormData>),
    },
  )

  const { createInvitation, updateInvitation } = useOrganizationInvite({
    organizationId: organization?.id,
    inviteId: initialData?.id,
  })

  const onSubmit: SubmitHandler<MemberInviteFormData> = async (data) => {
    setIsBusy(true)
    // const res = await toastyRequest(() => {
    //   if (isUpdate) return updateInvitation.mutateAsync(data)
    //   return createInvitation.mutateAsync(data)
    // })
    if (isUpdate) {
      const res = await toastyRequest(() => updateInvitation.mutateAsync(data))
      if (successful(res?.status)) {
        onOpenChange(false)
      }
    } else {
      const res = await toastyRequest(
        () => createInvitation.mutateAsync(data),
        { success: 'Invitation sent!' },
      )
      if (successful(res?.status)) {
        onOpenChange(false)
      }
    }
    setIsBusy(false)
  }

  const onClose = () => {
    reset()
    setIsBusy(false)
  }

  const [isBusy, setIsBusy] = useState(false)

  useDisableInteraction({ disable: isBusy })

  return (
    <>
      {isBusy ? <FullScreenLoader /> : null}
      <Modal
        open={open}
        onOpenChange={(newOpen) => {
          onOpenChange(newOpen)
          onClose()
        }}
        title='Invite to Organization'
        description='A form for inviting a new member to this organization.'
        preventOutsideClose
        {...modalProps}
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
                disabled={isUpdate}
                helper={
                  isUpdate
                    ? 'If you need to change the email, cancel this invitation and create a new one.'
                    : undefined
                }
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
                      const isChecked = value?.includes(role)
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
                            checked={isChecked}
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
              variant='outline'
              onClick={() => {
                onOpenChange(false)
                onClose()
              }}
            >
              Cancel
            </Button>
            <Button
              type='submit'
              // loading={isBusy}
            >
              {isUpdate ? 'Save' : 'Send invitation'}
            </Button>
          </FormActionBar>
        </form>
      </Modal>
    </>
  )
}

export default MemberInviteForm
