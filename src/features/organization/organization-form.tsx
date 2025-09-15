'use client'

import { Organization } from '@prisma/client'
import { useRouter } from 'next/navigation'
import { FC } from 'react'
import { Controller, SubmitHandler, useFormState } from 'react-hook-form'

import {
  OrganizationFormData,
  organizationSchema,
} from '@/lib/db/schemas/organization'
import { cn } from '@/lib/utils'

import { successful } from '@/utils/fetch'
import { formDefaults } from '@/utils/form'
import { homeUrl } from '@/utils/nav'
import { sanitizeFormData } from '@/utils/zod'

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
    defaultValues: formDefaults(defaultFormValues, organization),
    disabled,
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

  // const [noChanges, setNoChanges] = useState(false)

  // Detects if a save has been attempted with no changes.
  // This state then gets set to false with a delay in the onSubmit.
  // useEffect(() => {
  //   setNoChanges(!!submitCount && !isDirty && isUpdate)
  // }, [isDirty, isUpdate, submitCount])

  const onSubmit: SubmitHandler<OrganizationFormData> = async (data) => {
    if (!isDirty) {
      // debounce(() => {
      //   setNoChanges(false)
      // }, 3000)()
      return
    }

    // Sanitize form data before sending to API
    const sanitizedData = sanitizeFormData(data, {
      name: 'name',
    })

    const payload = isUpdate
      ? sanitizedData
      : { ...organization, ...sanitizedData }

    if (isUpdate) {
      await updateOrganization.mutateAsync(payload)
    } else {
      await createOrganization.mutateAsync(payload, {
        onSuccess: (res) => {
          if (successful(res?.status)) {
            router.replace(prevUrl)
          }
        },
      })
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
                />
              )}
            />
          </div>
        </div>
      </div>
      <div className='flex flex-col gap-2'>
        <FormActionBar>
          {!isUpdate ? (
            <Button
              variant='outline'
              onClick={onCancel}
              className='max-sm:w-1/2'
            >
              Cancel
            </Button>
          ) : null}
          <Button
            type='submit'
            disabled={disabled}
            className={cn(!isUpdate && 'max-sm:w-1/2')}
          >
            {isUpdate ? 'Save' : 'Create'}
          </Button>
        </FormActionBar>
        {/* {noChanges ? (
          <span
            role='alert'
            className={cn(
              'text-xs text-gray-600 text-pretty',
              'self-end absolute mt-12',
            )}
          >
            There are no changes to save.
          </span>
        ) : null} */}
      </div>
    </Form>
  )
}

export default OrganizationForm
