export const siteConfig = {
  title: 'Next Template Generic',
  description: 'A generic Next.js starter project.',
  url: process.env.SITE_BASE_URL || '',
} as const

/** Appends the provided pathname to the site's base URL. */
export const canonicalUrl = (path: string) => `${siteConfig?.url}${path}`
