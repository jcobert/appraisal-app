export type CrumbMeta = {
  segment: string
  path: string
  name?: string
  hidden?: boolean
  link?: boolean
}

/**
 * Returns the provided array of path `segments` as breadcrumb meta.
 * Optional `overrides` can be used customize breadcrumb meta.
 */
export const buildCrumbsFromSegments = (
  segments: string[],
  overrides?: Omit<CrumbMeta, 'path'>[],
) => {
  if (!segments) return []
  return segments?.reduce((prev, segment, i, arr) => {
    const parentPath = arr?.slice(0, i)?.join('/')
    const fullPath = `${i > 0 ? '/' : ''}${parentPath}/${segment}`
    const customCrumb = overrides?.find((c) => c?.segment === segment)
    const crumb = {
      segment,
      path: fullPath,
      name: segment,
      hidden: false,
      link: true,
      ...customCrumb,
    } satisfies (typeof prev)[number]
    const crumbs = prev.concat(crumb)
    return crumbs
  }, [] as CrumbMeta[])
}
