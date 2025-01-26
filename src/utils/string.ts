export const fullName = (
  first: string | null = '',
  last: string | null = '',
) => {
  return `${first}${last ? ` ${last}` : ''}`?.trim()
}

/** Returns the provided string with all non-digits stripped out. */
export const digitString = (val?: string) => {
  if (!val) return ''
  return val.replace(/\D/g, '')
}
