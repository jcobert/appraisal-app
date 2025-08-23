/** Returns absolute url to assets. */
export const getAssetPath = (path?: string) => {
  const base =
    process.env.NODE_ENV === 'development'
      ? 'http://localhost:3000'
      : process.env.NEXT_PUBLIC_SITE_BASE_URL || ''
  return `${base}${path}`
}
