import { format, isAfter, isValid, parseISO } from 'date-fns'

/**
 * Converts a locally-selected Date (e.g. from a calendar picker) into a
 * UTC-midnight Date that preserves the chosen calendar date regardless of
 * the user's timezone.
 *
 * Use this before sending a date value to the server / Prisma.
 *
 * @example
 *   // User in PST picks "Mar 15" → local midnight = 2025-03-15T08:00:00Z (wrong UTC date in some zones)
 *   toUTCDate(new Date(2025, 2, 15)) // → 2025-03-15T00:00:00.000Z ✓
 */
export const toUTCDate = (
  date: Date | null | undefined,
): Date | null | undefined => {
  if (!date || !isValid(date)) return date
  return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
}

/**
 * Converts a locally-selected Date+time into a "wall-clock" UTC Date — the
 * stored UTC numbers will match the face value the user selected, regardless
 * of their local timezone.
 *
 * Use this for datetime fields (e.g. inspectionDate) where the time matters
 * but must remain fixed for all viewers (not converted to their local zone).
 *
 * @example
 *   // User in PST selects "Mar 15 at 10:00 AM" → local = 2025-03-15T10:00-07:00
 *   toUTCDateTime(date) // → 2025-03-15T10:00:00.000Z  (face value preserved)
 */
export const toUTCDateTime = (
  date: Date | null | undefined,
): Date | null | undefined => {
  if (!date || !isValid(date)) return date
  return new Date(
    Date.UTC(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      date.getHours(),
      date.getMinutes(),
      date.getSeconds(),
    ),
  )
}

/**
 * Formats a datetime value (ISO string or Date) for display, showing date +
 * time with NO timezone conversion — the face value stored is what is shown.
 *
 * Use this for fields saved with toUTCDateTime (e.g. inspectionDate).
 *
 * @example
 *   formatCalendarDateTime('2025-03-15T10:00:00.000Z') // → "Mar 15, 2025 10:00 AM" everywhere
 */
export const formatCalendarDateTime = (
  value: string | Date | null | undefined,
  dateFormat = 'PP p',
): string => {
  if (!value) return ''
  const isoStr = value instanceof Date ? value.toISOString() : value
  // Strip the trailing Z/offset so date-fns parses it as a local wall-clock time
  const localStr = isoStr.replace(/\.\d+Z$/, '').replace(/Z$/, '')
  const parsed = parseISO(localStr)
  return isValid(parsed) ? format(parsed, dateFormat) : ''
}

/**
 * Formats a date value (ISO string or Date) for display, treating it as a
 * calendar date with NO timezone conversion.
 *
 * Safe to use with both @db.Date fields (Prisma returns "2025-03-15T00:00:00Z")
 * and plain date strings ("2025-03-15"). The date shown will always match the
 * stored calendar date — it will NOT shift based on the viewer's timezone.
 *
 * @example
 *   formatCalendarDate('2025-03-15T00:00:00.000Z') // → "Mar 15, 2025" everywhere
 */
export const formatCalendarDate = (
  value: string | Date | null | undefined,
  dateFormat = 'PP',
): string => {
  if (!value) return ''
  // Extract the YYYY-MM-DD portion from an ISO string so parseISO interprets
  // it as a local (wall-clock) date rather than a UTC instant.
  const isoStr = value instanceof Date ? value.toISOString() : value
  const datePart = isoStr.split('T')[0] ?? isoStr
  const parsed = parseISO(datePart) // date-fns treats date-only strings as local
  return isValid(parsed) ? format(parsed, dateFormat) : ''
}

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
