'use client'

import { Organization } from '@prisma/client'
import { useRouter } from 'next/navigation'
import { FC, useEffect } from 'react'
import { Controller, SubmitHandler } from 'react-hook-form'

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

import { useOrgPageRedirect } from '@/hooks/use-org-page-redirect'
import { usePermissions } from '@/hooks/use-permissions'
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
  initialData?: Organization | null
}

const OrganizationForm: FC<Props> = ({ initialData }) => {
  const router = useRouter()

  const organizationId = initialData?.id || ''

  useProtectPage()

  const { can, isLoading: isLoadingPermissions } = usePermissions({
    area: 'organization',
    organizationId,
  })

  useOrgPageRedirect(organizationId, { enabled: !!organizationId })

  const userCanEditOrg = can('edit_org_info')

  const isUpdate = !!organizationId

  const prevUrl = homeUrl(true)

  const defaultValues = formDefaults(defaultFormValues, initialData)

  const { control, handleSubmit } = useZodForm<OrganizationFormData>(schema, {
    defaultValues,
  })

  const { createOrganization, updateOrganization } = useOrganizationMutations({
    organizationId,
    options: {
      transform: (payload) => {
        return { ...payload, name: payload?.name?.trim() }
      },
    },
  })

  // As extra security, redirect if user doesn't have permissions.
  // Could happen if user's rights were changed by admin while user is here.
  useEffect(() => {
    if (isUpdate && !userCanEditOrg && !isLoadingPermissions) {
      router.push(homeUrl(true))
    }
  }, [isUpdate, userCanEditOrg, isLoadingPermissions, router])

  const onSubmit: SubmitHandler<OrganizationFormData> = async (data) => {
    const payload = isUpdate ? data : { ...initialData, ...data }

    if (isUpdate) {
      const res = await toastyRequest(() =>
        updateOrganization.mutateAsync(payload),
      )
      if (successful(res.status)) {
        router.replace(prevUrl)
      }
    } else {
      const res = await toastyRequest(
        () => createOrganization.mutateAsync(payload),
        {
          success: () => `Organization ${payload?.name} has been created!`,
        },
      )
      if (successful(res.status)) {
        router.replace(prevUrl)
      }
    }
  }

  // const onCancel = () => {
  //   router.replace(prevUrl)
  // }

  return (
    <Form
      onSubmit={handleSubmit(onSubmit)}
      containerClassName='self-start border__ px-2'
    >
      <div className='grid grid-cols-1 gap-x-14 gap-y-8 md:grid-cols-3'>
        <SectionHeading
          title='Basic information'
          subtitle='Update general organization info.'
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
                  disabled={isLoadingPermissions}
                />
              )}
            />
          </div>
        </div>
      </div>
      <FormActionBar>
        {/* <Button variant='outline' onClick={onCancel} className='max-sm:w-full'>
          Cancel
        </Button> */}
        <Button
          type='submit'
          // className='max-sm:w-full'
          disabled={isLoadingPermissions}
        >
          {isUpdate ? 'Save' : 'Create'}
        </Button>
      </FormActionBar>
    </Form>
  )
}

export default OrganizationForm
