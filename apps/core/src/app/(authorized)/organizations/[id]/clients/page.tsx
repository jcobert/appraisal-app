import { PlusIcon } from 'lucide-react'
import Link from 'next/link'
import { FC } from 'react'

import { PageParams } from '@repo/types'
import { Button } from '@repo/ui'

import { handleGetClients } from '@/lib/db/handlers/client-handlers'
import { protectPage, userCan } from '@/lib/db/utils'

import { createQueryClient, prefetchQuery } from '@/utils/query'

import Heading from '@/components/layout/heading'

import { clientsQueryKey } from '@/configuration/react-query/query-keys'
import ClientsOverview from '@/features/clients/clients-overview'

const Page: FC<PageParams<{ id: string }>> = async ({ params }) => {
  const organizationId = (await params)?.id

  await protectPage({ permission: { action: 'clients:view', organizationId } })

  const queryClient = createQueryClient()

  await Promise.all([
    queryClient.prefetchQuery({
      queryKey: clientsQueryKey.filtered({ organizationId }),
      queryFn: prefetchQuery(() => handleGetClients(organizationId)),
    }),
  ])

  const userCanEdit = await userCan({ action: 'clients:edit', organizationId })

  return (
    <div className='flex flex-col gap-4'>
      <div className='flex flex-col gap-4'>
        <Heading text='Clients' />
        <div className='flex justify-end'>
          <Button asChild variant='outline'>
            <Link href={`/organizations/${organizationId}/clients/create`}>
              <PlusIcon className='size-4' />
              New
            </Link>
          </Button>
        </div>
      </div>
      <ClientsOverview
        organizationId={organizationId}
        readonly={!userCanEdit}
      />
    </div>
  )
}

export default Page
