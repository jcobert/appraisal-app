import { isAfter, isValid } from 'date-fns'

/** Returns an ISO date string, the specified number of days in the future. */
export const generateExpiry = (days: number) => {
  const now = new Date()
  const expiryDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000)
  return expiryDate.toISOString()
}

export const isExpired = (expiry: Date | null | undefined) => {
  if (!expiry || !isValid(expiry)) return true
  const now = new Date()
  return isAfter(now, expiry)
}
