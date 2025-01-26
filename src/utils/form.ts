import { pick } from 'lodash'

import { Writeable } from '@/types/general'

/**
 * Replaces any null object values with empty string.
 * Useful for keeping form's dirty state accurate.
 */
export const prepareFormValues = (obj?: Record<string, unknown> | null) => {
  if (!obj) return obj
  const newObj: typeof obj = {}
  Object.entries(obj)?.forEach(([key, value]) => {
    newObj[key] = value ?? ''
  })
  return newObj
}

/**
 * Replaces any of the provided default values with those from the provided initial data.
 * Use for populating a form while ensuring empty fields have default values.
 */
export const formDefaults = <
  TDefaults extends Record<string, unknown> = Record<string, unknown>,
  TInitial extends
    | (Partial<Writeable<TDefaults>> | Record<string, unknown>)
    | null = Record<string, unknown>,
>(
  defaults: TDefaults,
  initial?: TInitial,
) => {
  return {
    ...defaults,
    ...pick(initial, Object.keys(defaults)),
  } as Writeable<TDefaults>
}
