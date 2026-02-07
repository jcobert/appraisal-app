'use client'

import { Order } from '@prisma/client'
import { AllCommunityModule, ColDef, ModuleRegistry } from 'ag-grid-community'
import { AgGridReact } from 'ag-grid-react'
import { FC, useMemo } from 'react'

ModuleRegistry.registerModules([AllCommunityModule])

export type OrdersTableData = Partial<Order>

type Props = {
  data: OrdersTableData[]
  readonly: boolean
  className?: string
}

const OrdersTable: FC<Props> = ({ data }) => {
  const columns = useMemo<ColDef<OrdersTableData>[]>(() => {
    return [
      { field: 'id', headerName: 'Order ID' },
      { field: 'appraisalType' },
      { field: 'fileNumber' },
    ]
  }, [])

  return (
    <div className='h-[50vh]'>
      <AgGridReact<OrdersTableData> columnDefs={columns} rowData={data} />
    </div>
  )
}

export default OrdersTable
