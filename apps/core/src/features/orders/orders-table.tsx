'use client'

import { AllCommunityModule, ColDef, ModuleRegistry } from 'ag-grid-community'
import { AgGridReact } from 'ag-grid-react'
import { FC, useMemo } from 'react'

import {
  formatCalendarDate,
  formatCalendarDateTime,
  formatCurrency,
  fullName,
} from '@repo/utils'

import { GetOrdersResult } from '@/lib/db/handlers/order-handlers'

import AddressCell from '@/features/orders/table/address-cell'
import ClientCell from '@/features/orders/table/client-cell'
import FeeCell from '@/features/orders/table/fee.cell'
import OrderStatusCell from '@/features/orders/table/order-status-cell'
import PaymentStatusCell from '@/features/orders/table/payment-status-cell'
import {
  ORDER_STATUS_LABEL,
  PAYMENT_STATUS_LABEL,
} from '@/features/orders/types'
import { getPropertyAddress } from '@/features/orders/utils'

ModuleRegistry.registerModules([AllCommunityModule])

export type OrdersTableData = NonNullable<GetOrdersResult['data']>[number] & {
  fees: Pick<
    NonNullable<GetOrdersResult['data']>[number],
    'baseFee' | 'techFee' | 'questionnaireFee'
  > & { totalFee: number }
}

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
        cellRenderer: AddressCell,
      },
      // { field: 'property.city', headerName: 'City' },
      // { field: 'property.state', headerName: 'State' },
      // { field: 'property.zip', headerName: 'ZIP' },
      {
        field: 'client',
        headerName: 'Client',
        valueFormatter: ({ data }) => data?.client?.name || '',
        cellRenderer: ClientCell,
      },
      {
        field: 'clientOrderNum',
        headerName: 'Client Ref No.',
      },
      {
        field: 'appraiser.user.firstName',
        headerName: 'Appraiser',
        valueFormatter: ({ data }) =>
          fullName(
            data?.appraiser?.user.firstName,
            data?.appraiser?.user?.lastName,
          ),
        width: 150,
      },
      {
        field: 'inspectionDate',
        headerName: 'Site Visit',
        valueFormatter: ({ value }) => formatCalendarDateTime(value as string),
      },
      {
        field: 'fees',
        headerName: 'Net Pay',
        valueFormatter: ({ data }) => formatCurrency(data?.fees.totalFee),
        width: 125,
        cellRenderer: FeeCell,
      },
      // {
      //   field: 'baseFee',
      //   headerName: 'Base Fee',
      //   valueFormatter: ({ data }) => formatCurrency(data?.baseFee),
      //   width: 125,
      // },
      // {
      //   field: 'techFee',
      //   headerName: 'Tech Fee',
      //   valueFormatter: ({ data }) => formatCurrency(data?.techFee),
      //   width: 125,
      // },
      // {
      //   field: 'questionnaireFee',
      //   headerName: 'Quest. Fee',
      //   valueFormatter: ({ data }) => formatCurrency(data?.questionnaireFee),
      //   width: 125,
      // },
      {
        field: 'sent',
        headerName: 'Sent',
        width: 100,
      },
      {
        field: 'paymentStatus',
        headerName: 'Paid',
        valueFormatter: ({ value }) => PAYMENT_STATUS_LABEL?.[value],
        cellRenderer: PaymentStatusCell,
        width: 125,
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
