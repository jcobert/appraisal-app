'use client'

import { FC, ReactNode, useMemo, useState } from 'react'

import {
  BreadcrumbContext,
  BreadcrumbContextType,
} from '@/providers/breadcrumbs/breadcrumb-context'

type Props = { children: ReactNode }

const BreadcrumbProvider: FC<Props> = ({ children }) => {
  const [crumbs, setCrumbs] = useState<BreadcrumbContextType['crumbs']>([])

  // const finalCrumbs = useMemo(() => {
  //   const newCrumbs = buildCrumbs(segments)?.map((newCrumb) => {
  //     const currCrumb = crumbs?.find(
  //       (curr) => curr?.segment === newCrumb?.segment,
  //     )
  //     return { ...newCrumb, name: currCrumb?.name || '' }
  //   })
  //   return newCrumbs
  // }, [crumbs, segments])◊

  // const updateCrumb = useCallback(
  //   (segment: CrumbMeta['segment'], name: CrumbMeta['name']) => {
  //     // const crumb = initialCrumbs?.find((c) => c?.segment === segment)
  //     // if (!crumb) return
  //     setCrumbs((prev) => {
  //       const newVal = [...prev]
  //       const currIndex = newVal?.findIndex((c) => c?.segment === segment)
  //       // if (currIndex < 0) return prev
  //       const newIndex =
  //         typeof currIndex === 'undefined' || currIndex < 0
  //           ? newVal.length
  //           : currIndex
  //       newVal[newIndex] = {
  //         // ...initialCrumbs?.find((c) => c?.segment === segment),
  //         ...(newVal?.[newIndex] || {}),
  //         name,
  //       } as (typeof newVal)[number]
  //       return newVal
  //     })
  //   },
  //   [setCrumbs],
  // )

  const context = useMemo<BreadcrumbContextType>(() => {
    return { crumbs, setCrumbs }
  }, [crumbs, setCrumbs])

  return (
    <BreadcrumbContext.Provider value={context}>
      {children}
    </BreadcrumbContext.Provider>
  )
}

export { type BreadcrumbContextType as BreadcrumbContext }
export default BreadcrumbProvider
