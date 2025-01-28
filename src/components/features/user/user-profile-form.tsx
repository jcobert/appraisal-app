'use client'

import { User } from '@prisma/client'
import { useRouter } from 'next-nprogress-bar'
import { FC } from 'react'
import { Controller, SubmitHandler } from 'react-hook-form'
import { z } from 'zod'

import { successful } from '@/utils/fetch'
import { formDefaults } from '@/utils/form'
import { withoutBlanks } from '@/utils/general'
import { fullName } from '@/utils/string'
import { toastyRequest } from '@/utils/toast'

import { useUserMutations } from '@/components/features/user/hooks/use-user-profile-mutations'
import Button from '@/components/general/button'
import PatternInput from '@/components/inputs/pattern-input'
import TextInput from '@/components/inputs/text-input'

import useZodForm from '@/hooks/use-zod-form'

import { TableMutable } from '@/types/db'
import { ZodObject } from '@/types/general'

const schema = z.object({
  firstName: z.string().nonempty(),
  lastName: z.string().nonempty(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
} satisfies ZodObject<
  Omit<TableMutable<User>, 'accountId' | 'userRole' | 'avatar'>
>)

type UserProfileFormData = z.infer<typeof schema>

const defaultFormValues = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
} satisfies UserProfileFormData

type Props = {
  initialData?: User | null
  registration?: boolean
}

const UserProfileForm: FC<Props> = ({ initialData, registration = false }) => {
  const router = useRouter()
  const isUpdate = !!initialData?.id
  const prevUrl = '/dashboard'

  const defaultValues = formDefaults(
    defaultFormValues,
    withoutBlanks(initialData || {}),
  )

  const { handleSubmit, control } = useZodForm<UserProfileFormData>(schema, {
    defaultValues,
  })

  const { createUser, updateUser, isPending, isSuccess } = useUserMutations({
    initialData,
  })

  const onSubmit: SubmitHandler<UserProfileFormData> = async (data) => {
    const payload = { ...initialData, ...data }
    if (isUpdate) {
      const res = await toastyRequest(() => updateUser.mutateAsync(payload))
      if (successful(res.status)) {
        router.push(prevUrl)
      }
    } else {
      const res = await toastyRequest(() => createUser.mutateAsync(payload), {
        success: () =>
          `Appraiser ${fullName(payload?.firstName, payload?.lastName)} has been created!`,
      })
      if (successful(res.status)) {
        router.push('/appraisers')
      }
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
                  // required
                  disabled
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
                  format='(###) ###-####'
                  mask='_'
                />
              )}
            />
          </div>
        </div>

        <div className='flex max-sm:flex-col justify-end items-center gap-6 mt-auto'>
          <Button
            variant={registration ? 'tertiary' : 'secondary'}
            onClick={onCancel}
          >
            {registration ? 'Set up later' : 'Cancel'}
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

export default UserProfileForm
