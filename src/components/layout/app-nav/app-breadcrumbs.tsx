'use client'

import Link from 'next/link'
import { FC, useMemo } from 'react'
import { useIsClient } from 'usehooks-ts'

import { buildCrumbsFromSegments } from '@/utils/breadcrumbs'

import { useBreadcrumbContext } from '@/providers/breadcrumbs/breadcrumb-context'

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Skeleton } from '@/components/ui/skeleton'

export type AppBreadcrumbsProps = {
  segments: string[]
}

const AppBreadcrumbs: FC<AppBreadcrumbsProps> = ({ segments }) => {
  const { crumbs, hidden: hideAll } = useBreadcrumbContext()
  const isClient = useIsClient()

  const breadcrumbs = useMemo(() => {
    return (
      crumbs?.length ? crumbs : buildCrumbsFromSegments(segments)
    )?.filter((c) => !c?.hidden)
  }, [crumbs, segments])

  if (hideAll || !breadcrumbs?.length) return null

  return (
    <Breadcrumb className='max-md:hidden'>
      <BreadcrumbList>
        {breadcrumbs?.map((crumb, i) => {
          const { name, path, hidden, segment } = crumb

          const label = decodeURI(name || segment)

          if (hidden) return null

          if (i === breadcrumbs.length - 1) {
            return (
              <BreadcrumbItem key={path}>
                {isClient ? (
                  <BreadcrumbPage className='capitalize'>
                    {label}
                  </BreadcrumbPage>
                ) : (
                  <Skeleton className='w-24 h-5' />
                )}
              </BreadcrumbItem>
            )
          }
          return (
            <div key={path} className='flex items-center gap-2.5'>
              <BreadcrumbItem>
                {isClient ? (
                  <BreadcrumbLink asChild>
                    <Link href={path} className='capitalize'>
                      {label}
                    </Link>
                  </BreadcrumbLink>
                ) : (
                  <Skeleton className='w-24 h-5' />
                )}
              </BreadcrumbItem>
              {isClient ? (
                <BreadcrumbSeparator />
              ) : (
                <Skeleton className='size-3' />
              )}
            </div>
          )
        })}
      </BreadcrumbList>
    </Breadcrumb>
  )
}

export default AppBreadcrumbs
