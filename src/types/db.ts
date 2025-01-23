export type TableBaseFields = {
  id: string
  createdAt: Date
  updatedAt: Date
  createdBy: string
  updatedBy: string
}

/** Returns table object type without auto-generated fields (creation date, uuid, etc.). */
export type TableMutable<T extends Record<string, unknown>> = Omit<
  T,
  keyof TableBaseFields
>

// type Table =
//   | 'appraiser'
//   | 'client'
//   | 'order'
//   | 'property'
//   | 'borrower'
//   | 'payment'
