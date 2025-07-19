'use client'

import { uniqBy } from 'lodash'
import { usePathname } from 'next/navigation'
import { FC, memo, useEffect } from 'react'

import {
  CrumbMeta,
  useBreadcrumbContext,
} from '@/providers/breadcrumbs/breadcrumb-context'

type Props = {
  name: CrumbMeta['name']
  segment: CrumbMeta['segment']
}

const Crumb: FC<Props> = ({ name, segment }) => {
  const { setCrumbs } = useBreadcrumbContext()
  const path = usePathname()

  useEffect(() => {
    setCrumbs((prev) =>
      uniqBy([...prev, { name, segment, path }], (c) => c?.path),
    )
  }, [])

  return <></>
}

export default memo(Crumb)
