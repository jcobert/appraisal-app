'use client'

import { Order, OrderStatus, PaymentStatus, PropertyType } from '@prisma/client'
import { useRouter } from 'next/navigation'
import { FC } from 'react'
import { Controller, SubmitHandler } from 'react-hook-form'

import { Button, Separator } from '@repo/ui'
import {
  US_STATES,
  formatZipCode,
  fullName,
  objectEntries,
  objectKeys,
  toUTCDate,
  toUTCDateTime,
} from '@repo/utils'

import { OrderFormData, orderSchema } from '@/lib/db/schemas/order'

import { formDefaults } from '@/utils/form'

import Form from '@/components/form/form'
import FormHeader from '@/components/form/form-header'
import CurrencyInput from '@/components/form/inputs/currency-input'
import DateInput from '@/components/form/inputs/date-input'
import SelectInput, {
  SelectOption,
} from '@/components/form/inputs/select-input'
import TextInput from '@/components/form/inputs/text-input'
import Heading from '@/components/layout/heading'

import useZodForm from '@/hooks/use-zod-form'

import FormSection from '@/features/orders/form/order-form-section'
import {
  UseOrderMutationsProps,
  useOrderMutations,
} from '@/features/orders/hooks/use-order-mutations'
import {
  ORDER_STATUS_LABEL,
  PAYMENT_STATUS_LABEL,
  PROPERTY_TYPE_LABEL,
} from '@/features/orders/types'
import { useGetOrganizations } from '@/features/organization/hooks/use-get-organizations'
import { DetailedOrgMember } from '@/features/organization/types'

const schema = orderSchema.form

const today = new Date()

const defaultFormValues = {
  appraisalType: null,
  appraiserId: null,
  clientId: null,
  borrowerId: null,
  propertyId: null,
  baseFee: null,
  contract: false,
  dueDate: null,
  fileNumber: '',
  clientOrderNum: '',
  inspectionDate: null,
  orderDate: today,
  orderStatus: 'open',
  paymentStatus: 'unpaid',
  questionnaire: false,
  questionnaireFee: null,
  sent: false,
  techFee: null,
  propertyType: '' as OrderFormData['propertyType'],
  street: '',
  street2: '',
  city: '',
  state: '',
  zip: '',
} satisfies OrderFormData

const propertyTypeOptions: SelectOption[] = objectKeys(PropertyType)
  .sort()
  ?.map((val) => ({
    value: val,
    label: PROPERTY_TYPE_LABEL[val],
  }))

const orderStatusOptions: SelectOption[] = objectKeys(OrderStatus)
  .sort()
  ?.map((val) => ({
    value: val,
    label: ORDER_STATUS_LABEL[val],
  }))

const paymentStatusOptions: SelectOption[] = objectKeys(PaymentStatus)
  .sort()
  ?.map((val) => ({
    value: val,
    label: PAYMENT_STATUS_LABEL[val],
  }))

const stateOptions: SelectOption[] = objectEntries(US_STATES)?.map(
  ([abbr, name]) => ({ value: abbr, label: name }),
)

const getAppraiserOptions = (
  members: DetailedOrgMember[] | undefined,
): SelectOption<string, string>[] => {
  if (!Array.isArray(members)) return []
  const appraisers = members.filter((mem) => mem.roles?.includes('appraiser'))
  return appraisers?.map((app) => ({
    value: app.id,
    label: fullName(app.user?.firstName, app.user?.lastName),
  }))
}

type Props = Pick<UseOrderMutationsProps, 'orderId' | 'organizationId'> & {
  order?: Order
}

const OrderForm: FC<Props> = ({ organizationId, orderId, order }) => {
  const router = useRouter()

  const ordersPage = `/organizations/${organizationId}/orders`

  const { response } = useGetOrganizations({
    id: organizationId,
  })

  const appraiserOptions = getAppraiserOptions(response?.data?.members)

  const { control, handleSubmit } = useZodForm<OrderFormData>(schema, {
    defaultValues: defaultFormValues,
    values: formDefaults(defaultFormValues, order),
  })

  // const { isDirty } = useFormState({ control })

  const { createOrder } = useOrderMutations({ organizationId, orderId })

  const onSubmit: SubmitHandler<OrderFormData> = async (data) => {
    // if (!isDirty) return

    // Normalize calendar dates to UTC midnight so the stored date portion
    // always matches the user's selected calendar date, regardless of timezone.
    const normalizedData = {
      ...data,
      orderDate: toUTCDate(data.orderDate) ?? null,
      dueDate: toUTCDate(data.dueDate) ?? null,
      inspectionDate: toUTCDateTime(data.inspectionDate) ?? null,
    }

    await createOrder.mutateAsync(normalizedData, {
      onSuccess: () => {
        router.replace(ordersPage)
      },
    })
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
            <Heading text='New Order' className='max-sm:hidden' />
            <div className='flex gap-4'>
              <Button
                variant='ghost'
                className='flex-1'
                onClick={() => {
                  router.push(ordersPage)
                }}
              >
                Cancel
              </Button>
              <Button type='submit' className='flex-1'>
                Create
              </Button>
            </div>
          </div>
        </FormHeader>
      }
    >
      <Heading text='New Order' className='sm:hidden' />
      <div className='flex flex-col gap-8'>
        <FormSection title='Tracking'>
          <Controller
            control={control}
            name='orderDate'
            render={({ field, fieldState: { error } }) => (
              <DateInput
                {...field}
                id={field.name}
                label='Order Received'
                error={error?.message}
                required
              />
            )}
          />
          <Controller
            control={control}
            name='clientOrderNum'
            render={({ field, fieldState: { error } }) => (
              <TextInput
                {...field}
                id={field.name}
                label='Client Reference Number'
                error={error?.message}
                tooltip='Optional reference number/ID provided by the client.'
              />
            )}
          />
          <Controller
            control={control}
            name='orderStatus'
            render={({ field, fieldState: { error } }) => (
              <SelectInput
                {...field}
                id={field.name}
                label='Order Status'
                error={error?.message}
                options={orderStatusOptions}
                value={field.value ?? undefined}
                required
              />
            )}
          />
        </FormSection>

        <Separator />

        <FormSection title='Assignment & Scheduling'>
          <Controller
            control={control}
            name='appraiserId'
            render={({ field, fieldState: { error } }) => (
              <SelectInput
                {...field}
                id={field.name}
                label='Appraiser'
                error={error?.message}
                options={appraiserOptions}
                value={field.value ?? undefined}
                clearable
              />
            )}
          />
          <Controller
            control={control}
            name='dueDate'
            render={({ field, fieldState: { error } }) => (
              <DateInput
                {...field}
                id={field.name}
                label='Order Due'
                error={error?.message}
              />
            )}
          />
          <Controller
            control={control}
            name='inspectionDate'
            render={({ field, fieldState: { error } }) => (
              <DateInput
                {...field}
                id={field.name}
                label='Site Visit'
                error={error?.message}
              />
            )}
          />
        </FormSection>

        <Separator />

        <FormSection title='Property'>
          <Controller
            control={control}
            name='propertyType'
            render={({ field, fieldState: { error } }) => (
              <SelectInput
                {...field}
                id={field.name}
                label='Property Type'
                error={error?.message}
                options={propertyTypeOptions}
                value={field.value ?? undefined}
                required
              />
            )}
          />
          <div className='flex flex-col gap-4'>
            <Controller
              control={control}
              name='street'
              render={({ field, fieldState: { error } }) => (
                <TextInput
                  {...field}
                  id={field.name}
                  label='Address 1'
                  error={error?.message}
                  required
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
            <Controller
              control={control}
              name='city'
              render={({ field, fieldState: { error } }) => (
                <TextInput
                  {...field}
                  id={field.name}
                  label='City'
                  error={error?.message}
                  required
                />
              )}
            />
            <div className='flex gap-4 w-full'>
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
                    required
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
                    required
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
        </FormSection>

        <Separator />

        <FormSection title='Payment'>
          <Controller
            control={control}
            name='baseFee'
            render={({ field, fieldState: { error } }) => (
              <CurrencyInput
                {...field}
                id={field.name}
                label='Base Fee'
                error={error?.message}
              />
            )}
          />
          <Controller
            control={control}
            name='techFee'
            render={({ field, fieldState: { error } }) => (
              <CurrencyInput
                {...field}
                id={field.name}
                label='Tech Fee'
                error={error?.message}
              />
            )}
          />
          <Controller
            control={control}
            name='questionnaireFee'
            render={({ field, fieldState: { error } }) => (
              <CurrencyInput
                {...field}
                id={field.name}
                label='Questionnaire Fee'
                error={error?.message}
              />
            )}
          />

          <Controller
            control={control}
            name='paymentStatus'
            render={({ field, fieldState: { error } }) => (
              <SelectInput
                {...field}
                id={field.name}
                label='Payment Status'
                error={error?.message}
                options={paymentStatusOptions}
                value={field.value ?? undefined}
                required
              />
            )}
          />
        </FormSection>
      </div>
    </Form>
  )
}

export default OrderForm
