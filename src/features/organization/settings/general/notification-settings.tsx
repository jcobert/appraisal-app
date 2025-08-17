'use client'

import { Organization } from '@prisma/client'
import { FC } from 'react'
import { SubmitHandler } from 'react-hook-form'

import { formDefaults } from '@/utils/form'
import { toastyRequest } from '@/utils/toast'

import Form from '@/components/form/form'
import FormActionBar from '@/components/form/form-action-bar'
import { Button } from '@/components/ui/button'

import SectionHeading from '@/features/organization/settings/section-heading'

const defaultFormValues = {}

type Props = {
  initialData?: Organization | null
  disabled?: boolean
  className?: string
}

const NotificationSettings: FC<Props> = ({
  initialData,
  disabled = true,
  className,
}) => {
  const defaultValues = formDefaults(defaultFormValues, initialData)

  // const { control, handleSubmit } = useZodForm(schema, {
  //   defaultValues,
  // })

  // const onSubmit = async (data) => {}

  return (
    <Form
      // onSubmit={handleSubmit(onSubmit)}
      containerClassName='self-start px-0'
      className={className}
    >
      <div className='grid grid-cols-1 gap-x-14 gap-y-8 md:grid-cols-3'>
        <SectionHeading
          title='Notification Settings'
          subtitle='Configure the types of notification you want to receive.'
        />

        <div className='md:col-span-2'>
          <div className='grid grid-cols-1 gap-4 sm:grid-cols-6'>
            {/* <Controller
              control={control}
              name=''
              render={({ field, fieldState: { error } }) => (
                
              )}
            /> */}
          </div>
        </div>
      </div>
      {/* <FormActionBar>
        <Button type='submit' disabled={disabled}>
          Save
        </Button>
      </FormActionBar> */}
    </Form>
  )
}

export default NotificationSettings
