'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { Appraiser } from '@prisma/client'
import { useRouter } from 'next/navigation'
import { FC } from 'react'
import { Controller, SubmitHandler, useForm } from 'react-hook-form'
import { z } from 'zod'

import { CORE_API_ENDPOINTS } from '@/lib/db/config'

import { isSuccess } from '@/utils/fetch'
import { fullName } from '@/utils/string'
import { requestToast } from '@/utils/toast'

import Button from '@/components/general/button'
import TextInput from '@/components/inputs/text-input'
import Alert from '@/components/layout/alert'

import useCoreMutation from '@/hooks/use-core-mutation'

import { TableMutable } from '@/types/db'
import { ZodObject } from '@/types/general'

type AppraiserFormData = TableMutable<Appraiser>

type Props = {
  initialData?: Appraiser | null
}

const schema = z.object<ZodObject<AppraiserFormData>>({
  firstName: z.string(),
  lastName: z.string(),
})

const defaultValues = {
  firstName: '',
  lastName: '',
} as const satisfies AppraiserFormData

const AppraiserForm: FC<Props> = ({ initialData }) => {
  const router = useRouter()
  const isUpdate = !!initialData?.id
  const prevUrl = `/appraisers/${initialData?.id || ''}`

  const { handleSubmit, control } = useForm<AppraiserFormData>({
    mode: 'onSubmit',
    defaultValues: initialData || defaultValues,
    resolver: zodResolver(schema),
  })

  const { mutateAsync: createAppraiser } = useCoreMutation<
    AppraiserFormData,
    Appraiser
  >({
    url: CORE_API_ENDPOINTS.appraiser,
    method: 'POST',
  })

  const { mutateAsync: updateAppraiser } = useCoreMutation<
    AppraiserFormData,
    Appraiser
  >({
    url: `${CORE_API_ENDPOINTS.appraiser}/${initialData?.id}`,
    method: 'PUT',
  })

  const { mutateAsync: deleteAppraiser } = useCoreMutation<{}, Appraiser>({
    url: `${CORE_API_ENDPOINTS.appraiser}/${initialData?.id}`,
    method: 'DELETE',
  })

  const onSubmit: SubmitHandler<AppraiserFormData> = async (data) => {
    if (isUpdate) {
      await requestToast(() => updateAppraiser(data))
    } else {
      const res = await requestToast(() => createAppraiser(data), {
        success: () =>
          `Appraiser ${fullName(data?.firstName, data?.lastName)} has been created!`,
      })
      if (isSuccess(res.status)) {
        router.push('/appraisers')
      }
    }
  }

  const onDelete = async () => {
    const res = await requestToast(() => deleteAppraiser({}), {
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
      className='flex flex-col gap-8 h-full'
    >
      <div className='flex gap-6'>
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
            />
          )}
        />
      </div>

      <div className='flex max-sm:flex-col justify-end items-center gap-6 mt-auto'>
        {isUpdate ? (
          <Alert
            description={`${fullName(initialData?.firstName, initialData?.lastName)} will be permanently deleted.`}
            trigger={<Button variant='tertiary'>Delete</Button>}
            onConfirm={async () => {
              await onDelete()
            }}
          />
        ) : null}
        <Button variant='secondary' onClick={onCancel}>
          Cancel
        </Button>
        <Button type='submit'>{isUpdate ? 'Save' : 'Create'}</Button>
      </div>
    </form>
  )
}

export default AppraiserForm
