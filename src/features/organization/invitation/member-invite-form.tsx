import { OrgInvitation } from '@prisma/client'
import { FC, useMemo, useState } from 'react'
import { Controller, SubmitHandler } from 'react-hook-form'

import { ORG_INVITE_EXPIRY } from '@/lib/db/config'
import { orgMemberSchema, MemberInviteFormData } from '@/lib/db/schemas/org-member'

import { successful } from '@/utils/fetch'
import { formDefaults } from '@/utils/form'

import FormActionBar from '@/components/form/form-action-bar'
import TextInput from '@/components/form/inputs/text-input'
import Banner from '@/components/general/banner'
import FullScreenLoader from '@/components/layout/full-screen-loader'
import Modal, { ModalProps } from '@/components/layout/modal'
import { Button } from '@/components/ui/button'

import { useDisableInteraction } from '@/hooks/use-disable-interaction'
import useZodForm from '@/hooks/use-zod-form'

import MemberRoleFieldset from '@/features/organization/common/member-role-fieldset'
import { useOrganizationInvite } from '@/features/organization/hooks/use-organization-invite'
import { DetailedOrganization } from '@/features/organization/types'

type Props = {
  organization: Partial<DetailedOrganization> | null | undefined
  initialData?: Partial<OrgInvitation> | null
} & Required<Pick<ModalProps, 'open' | 'onOpenChange'>> &
  Partial<Omit<ModalProps, 'open' | 'onOpenChange' | 'children'>>

const formSchema = orgMemberSchema.form

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
  const [isBusy, setIsBusy] = useState(false)

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
    if (isUpdate) {
      const res = await updateInvitation.mutateAsync(data)
      if (successful(res?.status)) {
        onOpenChange(false)
      }
    } else {
      const res = await createInvitation.mutateAsync(data)
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
        title='Add Member'
        description='A form for inviting a new member to this organization.'
        preventOutsideClose
        {...modalProps}
      >
        <Banner>
          {`An email invitation will be sent to the
          person below. They will have ${ORG_INVITE_EXPIRY} ${(ORG_INVITE_EXPIRY as number) === 1 ? 'day' : 'days'} to accept.`}
        </Banner>

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
                  autoComplete='off'
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
                  autoComplete='off'
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
                placeholder='mail@example.com'
                required
                disabled={isUpdate}
                helper={
                  isUpdate
                    ? 'If you need to change the email, cancel this invitation and create a new one.'
                    : undefined
                }
                autoComplete='off'
              />
            )}
          />

          <Controller
            control={control}
            name='roles'
            render={({ field, fieldState: { error } }) => {
              return <MemberRoleFieldset {...field} error={error} required />
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
