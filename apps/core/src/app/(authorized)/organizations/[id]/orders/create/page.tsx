import { FC } from 'react'

import { PageParams } from '@repo/types'

import { protectPage } from '@/lib/db/utils'

import Heading from '@/components/layout/heading'

import OrderForm from '@/features/orders/order-form'

const Page: FC<PageParams<{ id: string }>> = async ({ params }) => {
  const organizationId = (await params)?.id

  await protectPage({ permission: { action: 'orders:create', organizationId } })

  return (
    <div className='flex flex-col gap-6'>
      <Heading text='Create Order' />
      <OrderForm organizationId={organizationId} />
    </div>
  )
}

export default Page
