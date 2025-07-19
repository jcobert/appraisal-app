'use client'

import { Dispatch, SetStateAction, createContext, useContext } from 'react'

export type CrumbMeta = { segment: string; name: string; path: string }

export type BreadcrumbContextType = {
  crumbs: CrumbMeta[]
  setCrumbs: Dispatch<SetStateAction<CrumbMeta[]>>
}

export const BreadcrumbContext = createContext<BreadcrumbContextType>({
  crumbs: [],
  setCrumbs: () => {},
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
