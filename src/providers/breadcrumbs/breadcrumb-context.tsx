'use client'

import { Dispatch, SetStateAction, createContext, useContext } from 'react'

import { CrumbMeta } from '@/utils/breadcrumbs'

export type BreadcrumbContextType = {
  crumbs: CrumbMeta[]
  setCrumbs: Dispatch<SetStateAction<CrumbMeta[]>>
  hidden: boolean
  setHidden: Dispatch<SetStateAction<boolean>>
}

export const BreadcrumbContext = createContext<BreadcrumbContextType>({
  crumbs: [],
  setCrumbs: () => {},
  hidden: false,
  setHidden: () => {},
})

export const useBreadcrumbContext = () => {
  const context = useContext(BreadcrumbContext)

  if (context === undefined) {
    throw new Error(
      'useBreadcrumbContext() must be used within <BreadcrumbContext.Provider>',
    )
  }

  return context
}
