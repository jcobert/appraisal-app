export const fullName = (
  first: string | null = '',
  last: string | null = '',
) => {
  return `${first}${last ? ` ${last}` : ''}`?.trim()
}
