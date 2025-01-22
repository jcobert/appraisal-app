'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { Appraiser } from '@prisma/client'
import { useRouter } from 'next/navigation'
import { FC } from 'react'
import { Controller, SubmitHandler, useForm } from 'react-hook-form'
import { z } from 'zod'

import { CORE_API_ENDPOINTS } from '@/lib/db/config'

import Button from '@/components/general/button'
import TextInput from '@/components/inputs/text-input'

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

  const { mutateAsync: createAppraiser } = useCoreMutation({
    url: CORE_API_ENDPOINTS.appraiser,
    method: 'POST',
  })

  const { mutateAsync: updateAppraiser } = useCoreMutation({
    url: `${CORE_API_ENDPOINTS.appraiser}/${initialData?.id}`,
    method: 'PUT',
  })

  const onSubmit: SubmitHandler<AppraiserFormData> = async (data) => {
    if (isUpdate) {
      await updateAppraiser(data)
    } else {
      await createAppraiser(data)
    }
  }

  const onCancel = () => {
    router.push(prevUrl)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className='flex flex-col gap-8'>
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
      <div className='flex justify-end items-center gap-6'>
        <Button variant='secondary' onClick={onCancel}>
          Cancel
        </Button>
        <Button type='submit'>{isUpdate ? 'Save' : 'Create'}</Button>
      </div>
    </form>
  )
}

export default AppraiserForm
