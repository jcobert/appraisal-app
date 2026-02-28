import { FC } from 'react'

import { PageParams } from '@repo/types'

import { protectPage } from '@/lib/db/utils'

import ClientForm from '@/features/clients/client-form'

const Page: FC<PageParams<{ id: string }>> = async ({ params }) => {
  const organizationId = (await params)?.id

  await protectPage({
    permission: { action: 'clients:create', organizationId },
  })

  return (
    <div className='flex flex-col gap-6'>
      <ClientForm organizationId={organizationId} />
    </div>
  )
}

export default Page
