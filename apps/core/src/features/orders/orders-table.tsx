'use client'

import { AllCommunityModule, ColDef, ModuleRegistry } from 'ag-grid-community'
import { AgGridReact } from 'ag-grid-react'
import { FC, useMemo } from 'react'

import { formatCalendarDate, formatCalendarDateTime } from '@repo/utils'

import { GetOrdersResult } from '@/lib/db/handlers/order-handlers'

import { ORDER_STATUS_LABEL } from '@/features/orders/types'
import { getPropertyAddress } from '@/features/orders/utils'

ModuleRegistry.registerModules([AllCommunityModule])

export type OrdersTableData = NonNullable<GetOrdersResult['data']>[number]

export type OrdersTableProps = {
  data: OrdersTableData[] | null | undefined
  readonly: boolean
  className?: string
}

const OrdersTable: FC<OrdersTableProps> = ({ data }) => {
  const columns = useMemo<ColDef<OrdersTableData>[]>(() => {
    return [
      {
        field: 'orderStatus',
        headerName: 'Status',
        valueFormatter: ({ value }) => ORDER_STATUS_LABEL?.[value],
      },
      {
        field: 'orderDate',
        headerName: 'Received',
        valueFormatter: ({ value }) => formatCalendarDate(value as string),
      },
      {
        field: 'dueDate',
        headerName: 'Due',
        valueFormatter: ({ value }) => formatCalendarDate(value as string),
      },
      {
        field: 'property.street',
        headerName: 'Address',
        valueGetter: ({ data }) => getPropertyAddress(data?.property).address,
      },
      // { field: 'property.city', headerName: 'City' },
      // { field: 'property.state', headerName: 'State' },
      // { field: 'property.zip', headerName: 'ZIP' },
      {
        field: 'appraiser.user.firstName',
        headerName: 'Appraiser',
      },
      {
        field: 'inspectionDate',
        headerName: 'Site Visit',
        valueFormatter: ({ value }) => formatCalendarDateTime(value as string),
      },
    ]
  }, [])

  return (
    <div className='h-screen'>
      <AgGridReact<OrdersTableData>
        columnDefs={columns}
        rowData={data}
        gridOptions={{}}
      />
    </div>
  )
}

export default OrdersTable
