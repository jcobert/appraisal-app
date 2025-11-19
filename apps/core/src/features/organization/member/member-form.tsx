'use client'

import { FC, useState } from 'react'
import { Controller, SubmitHandler, useFormState } from 'react-hook-form'
import { z } from 'zod'

import { Button } from '@repo/ui'
import { fullName } from '@repo/utils'

import { orgMemberSchema } from '@/lib/db/schemas/org-member'

import { formDefaults } from '@/utils/form'

import FormActionBar from '@/components/form/form-action-bar'
import Banner from '@/components/general/banner'
import Modal, { ModalProps } from '@/components/layout/modal'

import { useDisableInteraction } from '@/hooks/use-disable-interaction'
import useZodForm from '@/hooks/use-zod-form'

import MemberRoleFieldset from '@/features/organization/common/member-role-fieldset'
import { useOrganizationMutations } from '@/features/organization/hooks/use-organization-mutations'
import { DetailedOrgMember } from '@/features/organization/types'

type Props = {
  className?: string
  member: DetailedOrgMember
  isActiveUser?: boolean
} & Required<Pick<ModalProps, 'open' | 'onOpenChange'>> &
  Partial<Omit<ModalProps, 'open' | 'onOpenChange' | 'children'>>

const formSchema = orgMemberSchema.form.pick({
  firstName: true,
  lastName: true,
  roles: true,
})

type MemberFormData = z.infer<typeof formSchema>

const DEFAULT_FORM_VALUES = {
  firstName: '',
  lastName: '',
  roles: [],
} satisfies MemberFormData

const MemberForm: FC<Props> = ({
  member,
  isActiveUser = false,
  open,
  onOpenChange,
  ...modalProps
}) => {
  const [isBusy, setIsBusy] = useState(false)

  const { updateOrgMember } = useOrganizationMutations({
    organizationId: member?.organizationId,
    memberId: member?.id,
  })

  const { control, handleSubmit } = useZodForm<MemberFormData>(formSchema, {
    mode: 'onSubmit',
    reValidateMode: 'onChange',
    defaultValues: formDefaults(DEFAULT_FORM_VALUES, {
      firstName: member?.user?.firstName,
      lastName: member?.user?.lastName,
      roles: member?.roles,
    } satisfies Partial<MemberFormData>),
    disabled: isBusy || updateOrgMember.isPending,
  })

  const { isDirty } = useFormState({ control })

  const onSubmit: SubmitHandler<MemberFormData> = async (data) => {
    if (!isDirty) {
      onOpenChange(false)
      return
    }
    setIsBusy(true)
    await updateOrgMember.mutateAsync(
      { roles: data?.roles },
      {
        onSuccess: () => {
          onOpenChange(false)
        },
      },
    )
    setIsBusy(false)
  }

  useDisableInteraction({ disable: isBusy })

  const isActiveOwner = isActiveUser && member?.isOwner

  return (
    <Modal
      open={open}
      onOpenChange={(newOpen) => {
        onOpenChange(newOpen)
        setIsBusy(false)
      }}
      title={fullName(member?.user?.firstName, member?.user?.lastName)}
      description='A form for inviting a new member to this organization.'
      preventOutsideClose
      {...modalProps}
    >
      {isActiveOwner ? (
        <Banner>You cannot remove yourself as owner.</Banner>
      ) : null}
      <form
        onSubmit={handleSubmit(onSubmit)}
        className='flex flex-col gap-4 gap-y-6'
      >
        <Controller
          control={control}
          name='roles'
          render={({ field, fieldState: { error } }) => {
            return (
              <MemberRoleFieldset
                {...field}
                disabled={(role) =>
                  (role === 'owner' && isActiveOwner) || !!field?.disabled
                }
                required
                error={error}
              />
            )
          }}
        />

        <FormActionBar className='mt-4'>
          <Button
            variant='outline'
            onClick={() => {
              onOpenChange(false)
              setIsBusy(false)
            }}
          >
            Cancel
          </Button>
          <Button type='submit' loading={isBusy} disabled={isBusy}>
            Save changes
          </Button>
        </FormActionBar>
      </form>
    </Modal>
  )
}

export default MemberForm
