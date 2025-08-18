'use client'

import { Organization } from '@prisma/client'
import { useRouter } from 'next/navigation'
import { FC } from 'react'
import { Controller, SubmitHandler, useFormState } from 'react-hook-form'

import {
  OrganizationFormData,
  organizationSchema,
} from '@/lib/db/schemas/organization'

import { successful } from '@/utils/fetch'
import { formDefaults } from '@/utils/form'
import { homeUrl } from '@/utils/nav'
import { toastyRequest } from '@/utils/toast'

import Form from '@/components/form/form'
import FormActionBar from '@/components/form/form-action-bar'
import TextInput from '@/components/form/inputs/text-input'
import { Button } from '@/components/ui/button'

import { useProtectPage } from '@/hooks/use-protect-page'
import useZodForm from '@/hooks/use-zod-form'

import { useOrganizationMutations } from '@/features/organization/hooks/use-organization-mutations'
import SectionHeading from '@/features/organization/settings/section-heading'

const schema = organizationSchema.form

const defaultFormValues = {
  name: '',
  avatar: '',
} satisfies OrganizationFormData

type Props = {
  organization?: Organization | null
  disabled?: boolean
  className?: string

  isUpdate?: boolean
}

const OrganizationForm: FC<Props> = ({
  organization,
  disabled,
  className,
  isUpdate = false,
}) => {
  const router = useRouter()

  const organizationId = organization?.id || ''

  useProtectPage()

  const prevUrl = homeUrl(true)

  const { control, handleSubmit } = useZodForm<OrganizationFormData>(schema, {
    defaultValues: defaultFormValues,
    values: formDefaults(defaultFormValues, organization),
  })

  const { isDirty } = useFormState({ control })

  const { createOrganization, updateOrganization } = useOrganizationMutations({
    organizationId,
    options: {
      transform: (payload) => {
        return { ...payload, name: payload?.name?.trim() }
      },
    },
  })

  const onSubmit: SubmitHandler<OrganizationFormData> = async (data) => {
    if (!isDirty) return
    const payload = isUpdate ? data : { ...organization, ...data }

    if (isUpdate) {
      await toastyRequest(() => updateOrganization.mutateAsync(payload))
    } else {
      await toastyRequest(
        () =>
          createOrganization.mutateAsync(payload, {
            onSuccess: (r) => {
              if (successful(r.status)) {
                router.replace(prevUrl)
              }
            },
          }),
        {
          success: () => `Organization ${payload?.name} has been created!`,
        },
      )
    }
  }

  const onCancel = () => {
    router.replace(prevUrl)
  }

  return (
    <Form
      onSubmit={handleSubmit(onSubmit)}
      containerClassName='self-start px-0'
      className={className}
    >
      <div className='grid grid-cols-1 gap-x-14 gap-y-8 md:grid-cols-3'>
        <SectionHeading
          title='Basic Information'
          subtitle={
            isUpdate
              ? 'Update general organization info.'
              : 'General organization info.'
          }
        />

        <div className='md:col-span-2'>
          <div className='grid grid-cols-1 gap-4 sm:grid-cols-6'>
            <Controller
              control={control}
              name='name'
              render={({ field, fieldState: { error } }) => (
                <TextInput
                  {...field}
                  id={field.name}
                  label='Name'
                  error={error?.message}
                  required
                  className='col-span-full'
                  disabled={disabled}
                />
              )}
            />
          </div>
        </div>
      </div>
      <FormActionBar>
        {!isUpdate ? (
          <Button
            variant='outline'
            onClick={onCancel}
            className='max-sm:w-full'
          >
            Cancel
          </Button>
        ) : null}
        <Button type='submit' disabled={disabled}>
          {isUpdate ? 'Save' : 'Create'}
        </Button>
      </FormActionBar>
    </Form>
  )
}

export default OrganizationForm
