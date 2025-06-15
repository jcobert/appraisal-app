import { FC } from 'react'
import { Controller, SubmitHandler } from 'react-hook-form'
import { z } from 'zod'

import FormActionBar from '@/components/form/form-action-bar'
import TextInput from '@/components/form/inputs/text-input'
import Button from '@/components/general/button'

import useZodForm from '@/hooks/use-zod-form'

type Props = {
  //
}

const schema = z.object({
  firstName: z.string().nonempty(),
  lastName: z.string().nonempty(),
  email: z.string().email(),
})

type MemberInviteFormData = z.infer<typeof schema>

const MemberInviteForm: FC<Props> = () => {
  const { control, handleSubmit } = useZodForm<MemberInviteFormData>(schema, {
    defaultValues: { email: '', firstName: '', lastName: '' },
  })

  const onSubmit: SubmitHandler<MemberInviteFormData> = (data) => {
    console.log(data)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className='flex flex-col gap-4'>
      <div className='flex gap-4 max-sm:flex-col'>
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
              icon='person'
              placeholder='First'
              required
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
              icon='person'
              placeholder='Last'
              required
            />
          )}
        />
      </div>

      <Controller
        control={control}
        name='email'
        render={({ field, fieldState: { error } }) => (
          <TextInput
            {...field}
            id={field.name}
            label='Email'
            error={error?.message}
            className=''
            icon='mail'
            placeholder='johnsmith@example.com'
            required
          />
        )}
      />

      <FormActionBar className='mt-4'>
        <Button type='submit'>Send invite</Button>
      </FormActionBar>
    </form>
  )
}

export default MemberInviteForm
