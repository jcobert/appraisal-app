'use client'

import { usePathname } from 'next/navigation'
import { FC, memo, useEffect } from 'react'

import { CrumbMeta, buildCrumbsFromSegments } from '@/utils/breadcrumbs'

import {
  BreadcrumbContextType,
  useBreadcrumbContext,
} from '@/providers/breadcrumbs/breadcrumb-context'

type Props = {
  /** * Array of breadcrumbs with customized meta. */
  crumbs?: {
    segment: CrumbMeta['segment']
    name?: CrumbMeta['name'] | undefined
    hidden?: CrumbMeta['hidden']
  }[]
  /** When `true` will hide all breadcrumbs. @default false */
  hidden?: BreadcrumbContextType['hidden']
}

const Crumbs: FC<Props> = ({ crumbs, hidden = false }) => {
  const path = usePathname()
  const { setCrumbs, setHidden } = useBreadcrumbContext()

  useEffect(() => {
    const segments = path?.split('/')?.filter(Boolean)
    const breadcrumbs = buildCrumbsFromSegments(segments, crumbs)
    setCrumbs(breadcrumbs)
    setHidden(hidden)
    return () => {
      setCrumbs([])
      setHidden(false)
    }
  }, [])

  return null
}

export default memo(Crumbs)
