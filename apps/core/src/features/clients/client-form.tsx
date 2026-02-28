'use client'

import { Client } from '@prisma/client'
import { useRouter } from 'next/navigation'
import { FC } from 'react'
import { Controller, SubmitHandler } from 'react-hook-form'

import { Button, Separator } from '@repo/ui'
import { US_STATES, cn, formatZipCode, objectEntries } from '@repo/utils'

import { ClientFormData, clientSchema } from '@/lib/db/schemas/client'

import { formDefaults } from '@/utils/form'

import Form from '@/components/form/form'
import FormHeader from '@/components/form/form-header'
import FormSection from '@/components/form/form-section'
import PhoneInput from '@/components/form/inputs/phone-input'
import SelectInput, {
  SelectOption,
} from '@/components/form/inputs/select-input'
import TextAreaInput from '@/components/form/inputs/text-area-input'
import TextInput from '@/components/form/inputs/text-input'
import Heading from '@/components/layout/heading'

import useZodForm from '@/hooks/use-zod-form'

import {
  UseClientMutationsProps,
  useClientMutations,
} from '@/features/clients/hooks/use-client-mutations'

const schema = clientSchema.form

const defaultFormValues = {
  name: '',
  phone: '',
  email: '',
  street: '',
  street2: '',
  city: '',
  state: '',
  zip: '',
  website: '',
  logo: null,
  pocFirstName: '',
  pocLastName: '',
  pocEmail: '',
  pocPhone: '',
  note: '',
  favorite: null,
} satisfies ClientFormData

const stateOptions: SelectOption[] = objectEntries(US_STATES)?.map(
  ([abbr, name]) => ({ value: abbr, label: name }),
)

type Props = Pick<UseClientMutationsProps, 'clientId' | 'organizationId'> & {
  client?: Client
}

const ClientForm: FC<Props> = ({ organizationId, clientId, client }) => {
  const router = useRouter()

  const clientsPage = `/organizations/${organizationId}/clients`

  const { control, handleSubmit } = useZodForm<ClientFormData>(schema, {
    defaultValues: defaultFormValues,
    values: formDefaults(defaultFormValues, client),
  })

  const { createClient, updateClient } = useClientMutations({
    organizationId,
    clientId,
  })

  const onSubmit: SubmitHandler<ClientFormData> = async (data) => {
    if (clientId) {
      await updateClient.mutateAsync(data, {
        onSuccess: () => {
          router.replace(clientsPage)
        },
      })
    } else {
      await createClient.mutateAsync(data, {
        onSuccess: () => {
          router.replace(clientsPage)
        },
      })
    }
  }

  return (
    <Form
      onSubmit={handleSubmit(onSubmit, (errors) => {
        // eslint-disable-next-line no-console
        console.log({ errors })
      })}
      containerClassName='self-start max-w-7xl'
      header={
        <FormHeader>
          <div className='flex sm:justify-between sm:items-center max-sm:flex-col max-sm:gap-4'>
            <Heading
              text={clientId ? 'Edit Client' : 'New Client'}
              className='max-sm:hidden'
            />
            <div className='flex gap-4'>
              <Button
                variant='ghost'
                className='flex-1'
                onClick={() => {
                  router.push(clientsPage)
                }}
              >
                Cancel
              </Button>
              <Button type='submit' className='flex-1'>
                {clientId ? 'Update' : 'Create'}
              </Button>
            </div>
          </div>
        </FormHeader>
      }
    >
      <Heading
        text={clientId ? 'Edit Client' : 'New Client'}
        className='sm:hidden'
      />
      <div className='flex flex-col gap-8'>
        <FormSection title='Company'>
          <Controller
            control={control}
            name='name'
            render={({ field, fieldState: { error } }) => (
              <TextInput
                {...field}
                id={field.name}
                label='Name'
                error={error?.message}
                required
              />
            )}
          />
          <Controller
            control={control}
            name='phone'
            render={({ field, fieldState: { error } }) => (
              <PhoneInput
                {...field}
                id={field.name}
                label='Phone'
                error={error?.message}
              />
            )}
          />
          <Controller
            control={control}
            name='email'
            render={({ field, fieldState: { error } }) => (
              <TextInput
                {...field}
                id={field.name}
                label='Email'
                error={error?.message}
                type='email'
              />
            )}
          />
          <Controller
            control={control}
            name='website'
            render={({ field, fieldState: { error } }) => (
              <TextInput
                {...field}
                id={field.name}
                label='Website'
                error={error?.message}
              />
            )}
          />
          <fieldset
            className={cn(
              'grid grid-cols-1 gap-8 md:grid-cols-2 md:col-span-2',
              'md:border md:p-3 md:rounded-md',
            )}
          >
            <div className='flex flex-col gap-8 md:gap-4'>
              <Controller
                control={control}
                name='street'
                render={({ field, fieldState: { error } }) => (
                  <TextInput
                    {...field}
                    id={field.name}
                    label='Address 1'
                    error={error?.message}
                  />
                )}
              />
              <Controller
                control={control}
                name='street2'
                render={({ field, fieldState: { error } }) => (
                  <TextInput
                    {...field}
                    id={field.name}
                    label='Address 2'
                    error={error?.message}
                  />
                )}
              />
            </div>
            <div className='flex flex-col gap-8 md:gap-4'>
              <Controller
                control={control}
                name='city'
                render={({ field, fieldState: { error } }) => (
                  <TextInput
                    {...field}
                    id={field.name}
                    label='City'
                    error={error?.message}
                  />
                )}
              />
              <div className='flex gap-8 md:gap-4 w-full'>
                <Controller
                  control={control}
                  name='state'
                  render={({ field, fieldState: { error } }) => (
                    <SelectInput
                      {...field}
                      id={field.name}
                      label='State'
                      error={error?.message}
                      options={stateOptions}
                      value={field.value ?? undefined}
                      displayValue
                    />
                  )}
                />
                <Controller
                  control={control}
                  name='zip'
                  render={({ field, fieldState: { error } }) => (
                    <TextInput
                      {...field}
                      id={field.name}
                      label='ZIP'
                      error={error?.message}
                      className='flex-auto'
                      maxLength={10}
                      onChange={(e) => {
                        const value = formatZipCode(e.target.value)
                        field.onChange(value)
                      }}
                    />
                  )}
                />
              </div>
            </div>
          </fieldset>
        </FormSection>

        <Separator />

        <FormSection title='Point of Contact'>
          <Controller
            control={control}
            name='pocFirstName'
            render={({ field, fieldState: { error } }) => (
              <TextInput
                {...field}
                id={field.name}
                label='First Name'
                error={error?.message}
              />
            )}
          />
          <Controller
            control={control}
            name='pocLastName'
            render={({ field, fieldState: { error } }) => (
              <TextInput
                {...field}
                id={field.name}
                label='Last Name'
                error={error?.message}
              />
            )}
          />
          <Controller
            control={control}
            name='pocEmail'
            render={({ field, fieldState: { error } }) => (
              <TextInput
                {...field}
                id={field.name}
                label='Email'
                type='email'
                error={error?.message}
              />
            )}
          />
          <Controller
            control={control}
            name='pocPhone'
            render={({ field, fieldState: { error } }) => (
              <PhoneInput
                {...field}
                id={field.name}
                label='Phone'
                error={error?.message}
              />
            )}
          />
        </FormSection>

        <Separator />

        <FormSection>
          <Controller
            control={control}
            name='note'
            render={({ field, fieldState: { error } }) => (
              <TextAreaInput
                {...field}
                id={field.name}
                label='Notes'
                error={error?.message}
                className='md:col-span-2'
              />
            )}
          />
        </FormSection>
      </div>
    </Form>
  )
}

export default ClientForm
