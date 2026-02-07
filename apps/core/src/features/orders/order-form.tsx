'use client'

import { Order, OrderStatus } from '@prisma/client'
import { useRouter } from 'next/navigation'
import { FC } from 'react'
import { Controller, SubmitHandler, useFormState } from 'react-hook-form'

import { Button } from '@repo/ui'
import { fullName, objectKeys } from '@repo/utils'

import { OrderFormData, orderSchema } from '@/lib/db/schemas/order'

import { formDefaults } from '@/utils/form'

import Form from '@/components/form/form'
import FormActionBar from '@/components/form/form-action-bar'
import DateInput from '@/components/form/inputs/date-input'
import SelectInput, {
  SelectOption,
} from '@/components/form/inputs/select-input'
import TextInput from '@/components/form/inputs/text-input'

import useZodForm from '@/hooks/use-zod-form'

import {
  UseOrderMutationsProps,
  useOrderMutations,
} from '@/features/orders/hooks/use-order-mutations'
import { ORDER_STATUS_LABEL } from '@/features/orders/types'
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
  inspectionDate: null,
  orderDate: today,
  orderStatus: 'open',
  paymentStatus: 'unpaid',
  questionnaire: false,
  questionnaireFee: null,
  sent: false,
  techFee: null,
} satisfies OrderFormData

// const orderStatusOptions: SelectOption[] = objectKeys(OrderStatus)?.map(
//   (val) => ({
//     value: val,
//     label: ORDER_STATUS_LABEL[val],
//   }),
// )

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

  const { isDirty } = useFormState({ control })

  const { createOrder } = useOrderMutations({ organizationId, orderId })

  const onSubmit: SubmitHandler<OrderFormData> = async (data) => {
    console.log(data)

    if (!isDirty) return

    // await createOrder.mutateAsync(data, {
    //   onSuccess: () => {
    //     router.replace(ordersPage)
    //   },
    // })
  }

  return (
    <Form
      onSubmit={handleSubmit(onSubmit, (errors) => {
        console.log(errors)
      })}
      containerClassName='self-start max-w-7xl border'
    >
      <div className='grid grid-cols-1 gap-x-14 gap-y-8 md:grid-cols-3'>
        {/* <SectionHeading title='Details' /> */}

        <Controller
          control={control}
          name='orderDate'
          render={({ field, fieldState: { error } }) => (
            <DateInput
              {...field}
              id={field.name}
              label='Order Date'
              error={error?.message}
            />
          )}
        />
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
            />
          )}
        />
        {/* <Controller
          control={control}
          name='orderStatus'
          render={({ field, fieldState: { error } }) => (
            <SelectInput
              {...field}
              id={field.name}
              label='Order Status'
              error={error?.message}
              options={orderStatusOptions}
              value={field.value ?? ''}
            />
          )}
        /> */}

        <Controller
          control={control}
          name='fileNumber'
          render={({ field, fieldState: { error } }) => (
            <TextInput
              {...field}
              id={field.name}
              label='File Number'
              error={error?.message}
            />
          )}
        />
      </div>

      <FormActionBar>
        <Button type='submit'>Create</Button>
      </FormActionBar>
    </Form>
  )
}

export default OrderForm
