'use client'

import { Appraiser } from '@prisma/client'
import { useRouter } from 'next-nprogress-bar'
import { FC } from 'react'
import { Controller, SubmitHandler } from 'react-hook-form'
import { z } from 'zod'

import { isSuccess } from '@/utils/fetch'
import { fullName } from '@/utils/string'
import { toastyRequest } from '@/utils/toast'

import { useAppraiserMutations } from '@/components/features/appraiser/hooks/use-appraiser-mutations'
import Button from '@/components/general/button'
import TextInput from '@/components/inputs/text-input'
import Alert from '@/components/layout/alert'
import Heading from '@/components/layout/heading'

import useZodForm from '@/hooks/use-zod-form'

import { TableMutable } from '@/types/db'
import { ZodObject } from '@/types/general'

export type AppraiserFormData = TableMutable<Appraiser>

type Props = {
  initialData?: Appraiser | null
}

const schema = z.object<ZodObject<AppraiserFormData>>({
  firstName: z.string().nonempty(),
  lastName: z.string().nonempty(),
})

const defaultValues = {
  firstName: '',
  lastName: '',
} as const satisfies AppraiserFormData

const AppraiserForm: FC<Props> = ({ initialData }) => {
  const router = useRouter()
  const isUpdate = !!initialData?.id
  const prevUrl = `/appraisers/${initialData?.id || ''}`

  const heading = isUpdate ? 'Edit Appraiser' : 'New Appraiser'

  const { handleSubmit, control } = useZodForm<AppraiserFormData>(schema, {
    defaultValues: initialData || defaultValues,
  })

  const { createAppraiser, updateAppraiser, deleteAppraiser } =
    useAppraiserMutations({ initialData })

  const onSubmit: SubmitHandler<AppraiserFormData> = async (data) => {
    if (isUpdate) {
      const res = await toastyRequest(() => updateAppraiser.mutateAsync(data))
      if (isSuccess(res.status)) {
        router.push(prevUrl)
      }
    } else {
      const res = await toastyRequest(() => createAppraiser.mutateAsync(data), {
        success: () =>
          `Appraiser ${fullName(data?.firstName, data?.lastName)} has been created!`,
      })
      if (isSuccess(res.status)) {
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
    if (isSuccess(res.status)) {
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
          {/* <div className='flex gap-6 max-sm:flex-col'>
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
                <TextInput
                  {...field}
                  id={field.name}
                  label='Phone'
                  error={error?.message}
                  className='flex-1'
                  icon='phone'
                  placeholder='(123) 456-7890'
                />
              )}
            />
          </div> */}
        </div>

        <div className='flex max-sm:flex-col justify-end items-center gap-6 mt-auto'>
          {isUpdate ? (
            <Alert
              description={`${fullName(initialData?.firstName, initialData?.lastName)} will be permanently deleted.`}
              trigger={
                <Button variant='tertiary' color='danger'>
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
          <Button type='submit'>{isUpdate ? 'Save' : 'Create'}</Button>
        </div>
      </div>
    </form>
  )
}

export default AppraiserForm
