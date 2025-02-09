'use client'

import { Organization } from '@prisma/client'
import { useRouter } from 'next/navigation'
import { FC } from 'react'
import { Controller, SubmitHandler } from 'react-hook-form'
import { z } from 'zod'

import { successful } from '@/utils/fetch'
import { formDefaults } from '@/utils/form'
import { toastyRequest } from '@/utils/toast'

import { useOrganizationMutations } from '@/components/features/organization/hooks/use-organization-mutations'
import Button from '@/components/general/button'
import Form from '@/components/form/form'
import FormActionBar from '@/components/form/form-action-bar'
import TextInput from '@/components/form/inputs/text-input'

import useZodForm from '@/hooks/use-zod-form'

import { TableMutable } from '@/types/db'
import { ZodObject } from '@/types/general'

const schema = z.object({
  name: z.string().nonempty(),
  avatar: z.string().optional(),
} satisfies ZodObject<TableMutable<Organization>>)

type OrganizationFormData = z.infer<typeof schema>

const defaultFormValues = {
  name: '',
  avatar: '',
} satisfies OrganizationFormData

type Props = {
  initialData?: Organization | null
}

const OrganizationForm: FC<Props> = ({ initialData }) => {
  const router = useRouter()
  const isUpdate = !!initialData?.id
  const prevUrl = `/organizations/${initialData?.id || ''}`

  const defaultValues = formDefaults(defaultFormValues, initialData)

  const { control, handleSubmit } = useZodForm<OrganizationFormData>(schema, {
    defaultValues,
  })

  const { createOrganization, updateOrganization } = useOrganizationMutations({
    initialData,
  })

  const onSubmit: SubmitHandler<OrganizationFormData> = async (data) => {
    const payload = { ...initialData, ...data }

    if (isUpdate) {
      const res = await toastyRequest(() =>
        updateOrganization.mutateAsync(payload),
      )
      if (successful(res.status)) {
        router.push(prevUrl)
      }
    } else {
      const res = await toastyRequest(
        () => createOrganization.mutateAsync(payload),
        {
          success: () => `Organization ${payload?.name} has been created!`,
        },
      )
      if (successful(res.status)) {
        router.push('/organizations')
      }
    }
  }

  const onCancel = () => {
    router.push(prevUrl)
  }

  return (
    <Form onSubmit={handleSubmit(onSubmit)}>
      <div>
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
            />
          )}
        />
      </div>

      <FormActionBar>
        <Button variant='secondary' onClick={onCancel}>
          Cancel
        </Button>
        <Button type='submit'>{isUpdate ? 'Save' : 'Create'}</Button>
      </FormActionBar>
    </Form>
  )
}

export default OrganizationForm
