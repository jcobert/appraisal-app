'use client'

import { Organization } from '@prisma/client'
import { useRouter } from 'next/navigation'
import { FC } from 'react'
import { SubmitHandler } from 'react-hook-form'
import { z } from 'zod'

import { formDefaults } from '@/utils/form'
import { asyncDelay } from '@/utils/general'

import Button from '@/components/general/button'
import Form from '@/components/general/form'
import FormActionBar from '@/components/general/form-action-bar'

import useZodForm from '@/hooks/use-zod-form'

import { TableMutable } from '@/types/db'
import { ZodObject } from '@/types/general'

const schema = z.object({
  name: z.string(),
  ownerId: z.string(),
  avatar: z.string().optional(),
} satisfies ZodObject<TableMutable<Organization>>)

type OrganizationFormData = z.infer<typeof schema>

const defaultFormValues = {
  name: '',
  avatar: '',
  ownerId: '',
} satisfies OrganizationFormData

type Props = {
  initialData?: Organization | null
}

const OrganizationForm: FC<Props> = ({ initialData }) => {
  const router = useRouter()
  const isUpdate = !!initialData?.id

  const defaultValues = formDefaults(defaultFormValues, initialData)

  const { control, handleSubmit } = useZodForm<OrganizationFormData>(schema, {
    defaultValues,
  })

  const onSubmit: SubmitHandler<OrganizationFormData> = async (data) => {
    await asyncDelay(2000)
  }

  return (
    <Form
      className='flex flex-col gap-8 max-sm:h-full'
      onSubmit={handleSubmit(onSubmit)}
    >
      <div className='p-8 border rounded'>
        <FormActionBar>
          <Button variant='secondary'>Cancel</Button>
          <Button type='submit'>{isUpdate ? 'Save' : 'Create'}</Button>
        </FormActionBar>
      </div>
    </Form>
  )
}

export default OrganizationForm
