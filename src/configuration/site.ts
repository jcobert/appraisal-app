export const siteConfig = {
  title: 'Appraisal App',
  description:
    'An app for real estate appraisers to organize and manage their jobs.',
  url: process.env.SITE_BASE_URL || '',
} as const

/** Appends the provided pathname to the site's base URL. */
export const canonicalUrl = (path: string) => `${siteConfig?.url}${path}`
