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
