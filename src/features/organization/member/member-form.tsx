'use client'

import { upperFirst } from 'lodash'
import { FC, useState } from 'react'
import { Controller, SubmitHandler, useFormState } from 'react-hook-form'
import { z } from 'zod'

import { orgMemberSchema } from '@/lib/db/schemas/org-member'

import { successful } from '@/utils/fetch'
import { formDefaults } from '@/utils/form'
import { fullName } from '@/utils/string'
import { toastyRequest } from '@/utils/toast'

import FieldError from '@/components/form/field-error'
import FieldLabel from '@/components/form/field-label'
import FormActionBar from '@/components/form/form-action-bar'
import Banner from '@/components/general/banner'
import Modal, { ModalProps } from '@/components/layout/modal'
import { Button } from '@/components/ui/button'

import { useDisableInteraction } from '@/hooks/use-disable-interaction'
import useZodForm from '@/hooks/use-zod-form'

import { useOrganizationMutations } from '@/features/organization/hooks/use-organization-mutations'
import { DetailedOrgMember } from '@/features/organization/types'
import { ORG_MEMBER_ROLES } from '@/features/organization/utils'

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

  const { control, handleSubmit } = useZodForm<MemberFormData>(formSchema, {
    mode: 'onSubmit',
    reValidateMode: 'onChange',
    defaultValues: formDefaults(DEFAULT_FORM_VALUES, {
      firstName: member?.user?.firstName,
      lastName: member?.user?.lastName,
      roles: member?.roles,
    } satisfies Partial<MemberFormData>),
  })

  const { isDirty } = useFormState({ control })

  const { updateOrgMember } = useOrganizationMutations({
    organizationId: member?.organizationId,
    memberId: member?.id,
  })

  const onSubmit: SubmitHandler<MemberFormData> = async (data) => {
    if (!isDirty) {
      onOpenChange(false)
      return
    }
    setIsBusy(true)
    await toastyRequest(() =>
      updateOrgMember.mutateAsync(
        { roles: data?.roles },
        {
          onSuccess: ({ status }) => {
            if (successful(status)) {
              onOpenChange(false)
            }
          },
        },
      ),
    )
    setIsBusy(false)
  }

  useDisableInteraction({ disable: isBusy })

  const isActiveOwner = isActiveUser && member?.roles?.includes('owner')

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
                    const disabled = role === 'owner' && isActiveOwner
                    return (
                      <div
                        key={role}
                        className='grid grid-cols-8 sm:grid-cols-6 grid-flow-row gap-2 sm:gap-8 items-center'
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
                          disabled={disabled}
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
              setIsBusy(false)
            }}
          >
            Cancel
          </Button>
          <Button
            type='submit'
            // loading={isBusy}
          >
            Save changes
          </Button>
        </FormActionBar>
      </form>
    </Modal>
  )
}

export default MemberForm
