'use client'

import { AllCommunityModule, ColDef, ModuleRegistry } from 'ag-grid-community'
import { AgGridReact } from 'ag-grid-react'
import { FC, useMemo } from 'react'

import {
  formatCalendarDate,
  formatCalendarDateTime,
  fullName,
} from '@repo/utils'

import { GetOrdersResult } from '@/lib/db/handlers/order-handlers'

import OrderStatusCell from '@/features/orders/table/order-status-cell'
import PaymentStatusCell from '@/features/orders/table/payment-status-cell'
import {
  ORDER_STATUS_LABEL,
  PAYMENT_STATUS_LABEL,
} from '@/features/orders/types'
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
        cellRenderer: OrderStatusCell,
        width: 125,
        minWidth: 125,
      },
      {
        field: 'orderDate',
        headerName: 'Received',
        valueFormatter: ({ value }) => formatCalendarDate(value as string),
        sort: 'desc',
        width: 125,
        minWidth: 125,
      },
      {
        field: 'dueDate',
        headerName: 'Due',
        valueFormatter: ({ value }) => formatCalendarDate(value as string),
        width: 125,
        minWidth: 125,
      },
      {
        field: 'property',
        headerName: 'Property',
        valueFormatter: ({ data }) =>
          getPropertyAddress(data?.property).address,
        // cellRenderer: AddressCell,
      },
      // { field: 'property.city', headerName: 'City' },
      // { field: 'property.state', headerName: 'State' },
      // { field: 'property.zip', headerName: 'ZIP' },
      {
        field: 'appraiser.user.firstName',
        headerName: 'Appraiser',
        valueFormatter: ({ data }) =>
          fullName(
            data?.appraiser?.user.firstName,
            data?.appraiser?.user?.lastName,
          ),
      },
      {
        field: 'inspectionDate',
        headerName: 'Site Visit',
        valueFormatter: ({ value }) => formatCalendarDateTime(value as string),
      },
      {
        field: 'paymentStatus',
        headerName: 'Payment',
        valueFormatter: ({ value }) => PAYMENT_STATUS_LABEL?.[value],
        cellRenderer: PaymentStatusCell,
      },
    ]
  }, [])

  return (
    <div className='h-screen'>
      <AgGridReact<OrdersTableData> columnDefs={columns} rowData={data} />
    </div>
  )
}

export default OrdersTable
