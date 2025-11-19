import { FC, useCallback, useMemo } from 'react'
import { Controller, SubmitHandler } from 'react-hook-form'
import { z } from 'zod'

import { Button } from '@repo/ui'
import { fullName } from '@repo/utils'

import { fieldBuilder } from '@/utils/zod'

import FormActionBar from '@/components/form/form-action-bar'
import SelectInput, {
  SelectOption,
} from '@/components/form/inputs/select-input'
import TextInput from '@/components/form/inputs/text-input'
import Banner from '@/components/general/banner'
import Modal, { ModalProps } from '@/components/layout/modal'

import useZodForm from '@/hooks/use-zod-form'

import { useOrganizationMutations } from '@/features/organization/hooks/use-organization-mutations'
import { DetailedOrganization } from '@/features/organization/types'

type Props = {
  organization: DetailedOrganization
} & ModalProps

enum OwnerType {
  EXISTING = 'existing',
  NEW = 'new',
}

const errorMap: z.ZodErrorMap = (issue, ctx) => {
  let msg = ctx.defaultError
  if (issue.code === 'invalid_literal') {
    msg = `Must match "${issue.expected}" exactly`
  }
  return { message: msg }
}

const TransferOwnerModal: FC<Props> = ({
  organization,
  open,
  onOpenChange,
  ...modalProps
}) => {
  const { name: orgName, members } = organization

  const schema = useMemo(() => {
    return z.object({
      ownerType: z.nativeEnum(OwnerType),
      member: z.string(),
      newUser: fieldBuilder.email({ label: 'Email' }),
      conf: z.literal(orgName, { errorMap }),
    })
  }, [orgName])

  const { control, reset, handleSubmit } = useZodForm<z.infer<typeof schema>>(
    schema,
    {
      defaultValues: {
        ownerType: OwnerType.EXISTING,
        member: '',
        newUser: '',
        conf: '',
      },
    },
  )

  const { transferOwnership } = useOrganizationMutations({
    organizationId: organization?.id,
  })

  const memberOptions = useMemo<SelectOption[]>(() => {
    if (!members || !members?.length) return []
    return members?.map((member) => ({
      value: member.id,
      label: fullName(member?.user?.firstName, member?.user?.lastName),
    }))
  }, [members])

  const onSubmit: SubmitHandler<z.infer<typeof schema>> = useCallback(
    async (data) => {
      await transferOwnership.mutateAsync(
        {
          newOwnerMemberId: data?.member,
        },
        { onSuccess: () => onOpenChange?.(false) },
      )
    },
    [onOpenChange, transferOwnership],
  )

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
      title='Transfer Organization'
      {...modalProps}
    >
      <p className='text-pretty py-2'>
        Transfer this organization to another user. Select an existing member of
        your organization or enter a new user.
      </p>
      <form className='flex flex-col gap-6' onSubmit={handleSubmit(onSubmit)}>
        {/* <fieldset>
          <input type='radio' />
        </fieldset> */}
        <div>
          <Controller
            control={control}
            name='member'
            render={({ field: { disabled, value, onChange, ...field } }) => (
              <SelectInput
                {...field}
                isDisabled={disabled}
                options={memberOptions}
                value={memberOptions?.find((opt) => opt?.value === value)}
                onChange={(opt) => {
                  onChange(opt?.value)
                }}
              />
            )}
          />
        </div>

        <div className='flex flex-col gap-8 -mx-6 border-y px-6 py-8 bg-gray-50'>
          <div>
            <p id='transfer-owner-conf-label' className='text-sm'>
              To confirm type, &quot;<b>{orgName}&quot;</b>
            </p>
            <Controller
              control={control}
              name='conf'
              render={({ field, fieldState: { error } }) => (
                <TextInput
                  {...field}
                  id={`transfer-owner-${field.name}`}
                  aria-labelledby='transfer-owner-conf-label'
                  error={error?.message}
                  applyErrorStateToLabel={false}
                  autoComplete='off'
                />
              )}
            />
          </div>
        </div>

        <Banner variant='info'>{`You will still be a member of ${orgName} after transfer.`}</Banner>

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
            Transfer Ownership
          </Button>
        </FormActionBar>
      </form>
    </Modal>
  )
}

export default TransferOwnerModal
