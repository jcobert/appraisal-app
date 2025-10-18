export const siteConfig = {
  title: 'PrizmaTrack',
  description:
    'An app for real estate appraisers to organize and manage their jobs.',
  url: process.env.NEXT_PUBLIC_SITE_BASE_URL || '',
  company: 'PrizmaTrack', // eventually legal entity (e.g. PrizmaTrack, LLC)
} as const

/** Appends the provided pathname to the site's base URL. */
export const canonicalUrl = (path: string) => `${siteConfig?.url}${path}`

/** Returns copyright text. */
export const copyright = () => {
  return `© ${new Date().getFullYear()} ${siteConfig.company}`
}
