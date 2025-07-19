'use client'

import { FC, ReactNode, useMemo, useState } from 'react'

import {
  BreadcrumbContext,
  BreadcrumbContextType,
} from '@/providers/breadcrumbs/breadcrumb-context'

type Props = { children: ReactNode }

const BreadcrumbProvider: FC<Props> = ({ children }) => {
  const [crumbs, setCrumbs] = useState<BreadcrumbContextType['crumbs']>([])
  const [hidden, setHidden] = useState<BreadcrumbContextType['hidden']>(false)

  const context = useMemo<BreadcrumbContextType>(() => {
    return { crumbs, setCrumbs, hidden, setHidden }
  }, [crumbs, setCrumbs, hidden, setHidden])

  return (
    <BreadcrumbContext.Provider value={context}>
      {children}
    </BreadcrumbContext.Provider>
  )
}

export { type BreadcrumbContextType as BreadcrumbContext }
export default BreadcrumbProvider
