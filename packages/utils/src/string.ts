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

export const greeting = (name?: string) => {
  return `Hi${name ? `, ${name}${name?.endsWith('.') ? '' : '.'}` : ''}`
}

export const formatZipCode = (val: string) => {
  let value = digitString(val) // Remove non-digits
  if (value.length > 5) {
    value = `${value.slice(0, 5)}-${value.slice(5, 9)}`
  }
  return value
}
