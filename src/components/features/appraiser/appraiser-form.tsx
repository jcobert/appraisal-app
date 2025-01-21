'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { Appraiser } from '@prisma/client'
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
  //
}

const AppraiserForm: FC<Props> = () => {
  const schema = z.object<ZodObject<AppraiserFormData>>({
    firstName: z.string(),
    lastName: z.string(),
  })

  const { handleSubmit, control } = useForm<AppraiserFormData>({
    mode: 'onSubmit',
    defaultValues: { firstName: '', lastName: '' },
    resolver: zodResolver(schema),
  })

  const { mutateAsync: createAppraiser } = useCoreMutation({
    url: CORE_API_ENDPOINTS.appraiser,
    method: 'POST',
  })

  const onSubmit: SubmitHandler<AppraiserFormData> = async (data) => {
    await createAppraiser(data)
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
        <Button variant='secondary'>Cancel</Button>
        <Button type='submit'>Create</Button>
      </div>
    </form>
  )
}

export default AppraiserForm
