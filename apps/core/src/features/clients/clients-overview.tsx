'use client'

import { FC } from 'react'

import NoResults from '@/components/general/no-results'

import ClientsTable, {
  ClientsTableData,
  ClientsTableProps,
} from '@/features/clients/clients-table'
import { useGetClients } from '@/features/clients/hooks/use-client-queries'

type Props = {
  organizationId: string
} & Pick<ClientsTableProps, 'readonly'>

const ClientsOverview: FC<Props> = ({ organizationId, readonly }) => {
  const { response, isFetched } = useGetClients({ organizationId })

  const clients = response?.data

  if (isFetched && !clients) return <NoResults />

  const tableData = clients?.map((client) => {
    return {
      ...client,
    } satisfies ClientsTableData
  })

  return (
    <div>
      <ClientsTable data={tableData} readonly={readonly} />
    </div>
  )
}

export default ClientsOverview
