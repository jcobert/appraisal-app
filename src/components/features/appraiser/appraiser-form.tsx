'use client'

import { Appraiser } from '@prisma/client'
import { useRouter } from 'next-nprogress-bar'
import { FC } from 'react'
import { Controller, SubmitHandler } from 'react-hook-form'

import { AppraiserFormData, appraiserSchema } from '@/lib/db/schemas/appraiser'

import { successful } from '@/utils/fetch'
import { formDefaults } from '@/utils/form'
import { fullName } from '@/utils/string'
import { toastyRequest } from '@/utils/toast'

import { useAppraiserMutations } from '@/components/features/appraiser/hooks/use-appraiser-mutations'
import PatternInput from '@/components/form/inputs/pattern-input'
import TextInput from '@/components/form/inputs/text-input'
import Button from '@/components/general/button'
import Alert from '@/components/layout/alert'
import Heading from '@/components/layout/heading'

import useZodForm from '@/hooks/use-zod-form'

const schema = appraiserSchema.form

const defaultFormValues = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  userId: '',
} satisfies AppraiserFormData

type Props = {
  initialData?: Appraiser | null
}

const AppraiserForm: FC<Props> = ({ initialData }) => {
  const router = useRouter()
  const isUpdate = !!initialData?.id
  const prevUrl = `/appraisers/${initialData?.id || ''}`

  const heading = isUpdate ? 'Edit Appraiser' : 'New Appraiser'

  const defaultValues = formDefaults(defaultFormValues, initialData)

  const { handleSubmit, control } = useZodForm<AppraiserFormData>(schema, {
    defaultValues,
  })

  const {
    createAppraiser,
    updateAppraiser,
    deleteAppraiser,
    isPending,
    isSuccess,
  } = useAppraiserMutations({ initialData })

  const onSubmit: SubmitHandler<AppraiserFormData> = async (data) => {
    const payload = { ...initialData, ...data }
    if (isUpdate) {
      const res = await toastyRequest(() =>
        updateAppraiser.mutateAsync(payload),
      )
      if (successful(res.status)) {
        router.push(prevUrl)
      }
    } else {
      const res = await toastyRequest(
        () => createAppraiser.mutateAsync(payload),
        {
          success: () =>
            `Appraiser ${fullName(payload?.firstName, payload?.lastName)} has been created!`,
        },
      )
      if (successful(res.status)) {
        router.push('/appraisers')
      }
    }
  }

  const onDelete = async () => {
    const res = await toastyRequest(() => deleteAppraiser.mutateAsync({}), {
      loading: 'Deleting appraiser...',
      success: ({ data }) =>
        `Appraiser ${fullName(data?.firstName, data?.lastName)} has been deleted.`,
    })
    if (successful(res.status)) {
      router.push('/appraisers')
    }
  }

  const onCancel = () => {
    router.push(prevUrl)
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className='flex flex-col gap-8 max-sm:h-full'
    >
      <div>
        {/* {isUpdate ? <Back href={prevUrl} text='Back' /> : null} */}
        <Heading text={heading} alignment='center' className='font-normal' />
      </div>

      {/* <p className='max-w-prose self-center w-full text-pretty'>
        Add a new appraiser to your organization.
      </p> */}

      <div className='flex flex-col gap-16 max-w-3xl self-center size-full border rounded bg-almost-white p-4'>
        <div className='flex flex-col gap-6'>
          <div className='flex gap-6 max-sm:flex-col'>
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
                  required
                  icon='person'
                  placeholder='First'
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
                  required
                  icon='person'
                  placeholder='Last'
                />
              )}
            />
          </div>
          <div className='flex gap-6 max-sm:flex-col'>
            <Controller
              control={control}
              name='email'
              render={({ field, fieldState: { error } }) => (
                <TextInput
                  {...field}
                  id={field.name}
                  label='Email'
                  error={error?.message}
                  className='flex-1'
                  icon='mail'
                  placeholder='johnsmith@example.com'
                />
              )}
            />
            <Controller
              control={control}
              name='phone'
              render={({ field, fieldState: { error } }) => (
                <PatternInput
                  {...field}
                  id={field.name}
                  label='Phone'
                  error={error?.message}
                  className='flex-1'
                  icon='phone'
                  placeholder='(123) 456-7890'
                  required
                  format='(###) ###-####'
                  mask='_'
                />
              )}
            />
          </div>
        </div>

        <div className='flex max-sm:flex-col justify-end items-center gap-6 mt-auto'>
          {isUpdate ? (
            <Alert
              description={`${fullName(initialData?.firstName, initialData?.lastName)} will be permanently deleted.`}
              trigger={
                <Button
                  variant='tertiary'
                  color='danger'
                  inert={isPending || deleteAppraiser.isSuccess}
                >
                  Delete
                </Button>
              }
              onConfirm={async () => {
                await onDelete()
              }}
              triggerWrapperClassName='sm:mr-auto'
            />
          ) : null}
          <Button variant='secondary' onClick={onCancel}>
            Cancel
          </Button>
          <Button
            type='submit'
            inert={isPending || isSuccess}
            loading={isPending}
          >
            {isUpdate ? 'Save' : 'Create'}
          </Button>
        </div>
      </div>
    </form>
  )
}

export default AppraiserForm
