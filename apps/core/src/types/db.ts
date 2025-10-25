export type TableBaseFields = {
  id: string
  createdAt: Date
  updatedAt: Date
  createdBy: string
  updatedBy: string
}

/** Returns table object type without standard auto-generated fields (audit user/timestamp, uuid, etc.). */
export type TableMutable<T extends Record<string, unknown>> = Omit<
  T,
  keyof TableBaseFields
>

/** Names of standard auto-generated fields (audit user/timestamp, uuid, etc.).  */
export const TABLE_BASE_FIELDS = [
  'id',
  'createdAt',
  'createdBy',
  'updatedAt',
  'updatedBy',
] as const satisfies (keyof TableBaseFields)[]
