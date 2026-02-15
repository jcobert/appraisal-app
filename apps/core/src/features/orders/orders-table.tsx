'use client'

import { AllCommunityModule, ColDef, ModuleRegistry } from 'ag-grid-community'
import { AgGridReact } from 'ag-grid-react'
import { parseISO } from 'date-fns'
import { FC, useMemo } from 'react'

import { GetOrdersResult } from '@/lib/db/handlers/order-handlers'

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
      { field: 'id', headerName: 'Order ID' },
      {
        field: 'orderDate',
        valueFormatter: ({ value }) => {
          return parseISO(value as string).toLocaleDateString(undefined, {
            dateStyle: 'medium',
          })

          // const dateStr = (value as string).split('T')[0] || ''
          // const [year = '', month = '', day = ''] = dateStr?.split('-')
          // return new Date(+year, +month - 1, +day).toLocaleDateString(
          //   undefined,
          //   {
          //     dateStyle: 'medium',
          //   },
          // )
        },
      },
      { field: 'dueDate' },
      {
        field: 'property.street',
        headerName: 'Address',
        valueGetter: ({ data }) => getPropertyAddress(data?.property).address,
      },
      { field: 'property.city', headerName: 'City' },
      { field: 'property.state', headerName: 'State' },
      { field: 'property.zip', headerName: 'ZIP' },
      { field: 'appraiser.user.firstName' },
      { field: 'inspectionDate' },
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
