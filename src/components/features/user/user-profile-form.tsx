'use client'

import { User } from '@prisma/client'
import { useRouter } from 'next-nprogress-bar'
import { FC, useState } from 'react'
import {
  Controller,
  SubmitHandler,
  useFormState,
  useWatch,
} from 'react-hook-form'
import { z } from 'zod'

import { successful } from '@/utils/fetch'
import { formDefaults } from '@/utils/form'
import { withoutBlanks } from '@/utils/general'
import { toastyRequest } from '@/utils/toast'

import { useUserMutations } from '@/components/features/user/hooks/use-user-profile-mutations'
import Button from '@/components/general/button'
import Form from '@/components/general/form'
import PatternInput from '@/components/inputs/pattern-input'
import TextInput from '@/components/inputs/text-input'
import Confirmation from '@/components/layout/confirmation'

import useZodForm from '@/hooks/use-zod-form'

import { TableMutable } from '@/types/db'
import { ZodObject } from '@/types/general'

const schema = z.object({
  firstName: z.string().nonempty(),
  lastName: z.string().nonempty(),
  email: z.string().email().nonempty(),
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

  const [confirmationOpen, setConfirmationOpen] = useState(false)

  const { handleSubmit, control, getValues } = useZodForm<UserProfileFormData>(
    schema,
    {
      defaultValues,
    },
  )

  const { isDirty, dirtyFields } = useFormState({ control })
  const email = useWatch({ control, name: 'email' })

  const { createUser, updateUser, isPending } = useUserMutations({
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
      const res = await toastyRequest(() => createUser.mutateAsync(payload))
      if (successful(res.status)) {
        router.push(prevUrl)
      }
    }
  }

  const onCancel = () => {
    router.push(prevUrl)
  }

  return (
    <Form
      onSubmit={handleSubmit((data) => {
        if (!isDirty) {
          router.push(prevUrl)
          return
        }

        if (dirtyFields?.email) {
          setConfirmationOpen(true)
          return
        } else {
          onSubmit(data)
        }
      })}
      className='flex flex-col gap-8 max-sm:h-full'
      loader='none'
    >
      {/* <p className='max-w-prose self-center w-full text-pretty'>
        Add a new appraiser to your organization.
      </p> */}

      <div className='flex flex-col gap-16 max-w-3xl self-center size-full border rounded bg-almost-white p-4'>
        <div className='flex flex-col gap-8'>
          <div className='flex flex-col gap-4'>
            <h2 className='font-medium text-lg'>Personal Info</h2>
            <div className='flex gap-6 flex-col'>
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
              <div>
                <Controller
                  control={control}
                  name='phone'
                  render={({ field, fieldState: { error } }) => (
                    <PatternInput
                      {...field}
                      id={field.name}
                      label='Phone'
                      error={error?.message}
                      className='flex-1 sm:w-[calc(50%-0.75rem)]'
                      icon='phone'
                      placeholder='(123) 456-7890'
                      format='(###) ###-####'
                      mask='_'
                    />
                  )}
                />
              </div>
            </div>
          </div>

          <div className='h-px w-full mx-auto border-b mt-3 mb-2' />

          <div className='flex flex-col gap-4'>
            <h2 className='font-medium text-lg'>Account Info</h2>
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
                    className='sm:w-[calc(50%-0.75rem)]'
                    icon='mail'
                    placeholder='johnsmith@example.com'
                    required
                  />
                )}
              />
            </div>
          </div>

          {/* <div className='h-px w-full mx-auto border-b mt-3 mb-2' />

          <div className='flex flex-col gap-4'>
            <h2 className='font-medium text-lg'>Settings</h2>
            <div className='flex gap-6 max-sm:flex-col'></div>
          </div> */}
        </div>

        <div className='flex max-sm:flex-col justify-end items-center gap-6 mt-auto'>
          <Button
            variant={registration ? 'tertiary' : 'secondary'}
            onClick={onCancel}
          >
            {registration ? 'Set up later' : 'Cancel'}
          </Button>
          <Button type='submit' loading={isPending}>
            {isUpdate ? 'Save' : 'Create'}
          </Button>
        </div>
      </div>

      <Confirmation
        title='Confirm Email'
        description={
          <div className='prose flex flex-col gap-2'>
            <div>
              You are changing the email that you use to sign into this account
              with. Please confirm that you entered it correctly.
            </div>
            <div className='font-medium text-center border__ rounded p-4 w-full mx-auto bg-gray-50'>
              {email}
            </div>
          </div>
        }
        open={confirmationOpen}
        onOpenChange={() => {
          setConfirmationOpen(false)
        }}
        onConfirm={() => {
          const data = getValues()
          onSubmit(data)
        }}
      />
    </Form>
  )
}

export default UserProfileForm
