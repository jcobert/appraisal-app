'use client'

import { AllCommunityModule, ColDef, ModuleRegistry } from 'ag-grid-community'
import { AgGridReact } from 'ag-grid-react'
import { FC, useMemo } from 'react'

import { GetClientsResult } from '@/lib/db/handlers/client-handlers'

import { getClientAddress } from '@/features/clients/utils'

ModuleRegistry.registerModules([AllCommunityModule])

export type ClientsTableData = NonNullable<GetClientsResult['data']>[number]

export type ClientsTableProps = {
  data: ClientsTableData[] | null | undefined
  readonly: boolean
  className?: string
}

const ClientsTable: FC<ClientsTableProps> = ({ data }) => {
  const columns = useMemo<ColDef<ClientsTableData>[]>(() => {
    return [
      {
        field: 'name',
        headerName: 'Name',
        sort: 'asc',
        width: 200,
      },
      {
        field: 'email',
        headerName: 'Email',
        width: 200,
      },
      {
        field: 'phone',
        headerName: 'Phone',
        width: 150,
      },
      {
        field: 'street',
        headerName: 'Address',
        valueFormatter: ({ data }) => getClientAddress(data).address,
        width: 250,
      },
      {
        field: 'poc',
        headerName: 'Point of Contact',
        width: 180,
      },
      {
        field: 'website',
        headerName: 'Website',
        width: 200,
      },
      {
        field: '_count.Order',
        headerName: 'Orders',
        valueFormatter: ({ data }) => String(data?._count?.Order || 0),
        width: 100,
      },
      {
        field: 'favorite',
        headerName: 'Favorite',
        valueFormatter: ({ value }) => (value ? 'Yes' : 'No'),
        width: 100,
      },
    ]
  }, [])

  return (
    <div className='h-screen'>
      <AgGridReact<ClientsTableData> columnDefs={columns} rowData={data} />
    </div>
  )
}

export default ClientsTable
