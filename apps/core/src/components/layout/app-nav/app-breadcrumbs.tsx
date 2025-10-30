'use client'

import Link from 'next/link'
import { FC, useMemo } from 'react'
import { useIsClient } from 'usehooks-ts'

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@repo/ui'
import { Skeleton } from '@repo/ui'

import { cn } from '@/lib/utils'

import { buildCrumbsFromSegments } from '@/utils/breadcrumbs'

import { useBreadcrumbContext } from '@/providers/breadcrumbs/breadcrumb-context'

export type AppBreadcrumbsProps = {
  segments: string[]
}

const AppBreadcrumbs: FC<AppBreadcrumbsProps> = ({ segments }) => {
  const { crumbs, hidden: hideAll } = useBreadcrumbContext()
  const isClient = useIsClient()

  const breadcrumbs = useMemo(() => {
    return crumbs?.length ? crumbs : buildCrumbsFromSegments(segments)
  }, [crumbs, segments])

  if (hideAll || !breadcrumbs?.length || breadcrumbs?.length < 2) return null

  return (
    <Breadcrumb
      className={cn(
        'max-md:hidden',
        'px-2 py-1 border rounded-md bg-sidebar/25 border-accent',
      )}
    >
      <BreadcrumbList>
        {breadcrumbs?.map((crumb, i) => {
          const { name, path, hidden, segment, link } = crumb

          const label = decodeURIComponent(name || segment)

          if (hidden) return null

          if (i === breadcrumbs.length - 1 || !link) {
            return (
              <div key={path} className='flex items-center gap-2.5'>
                <BreadcrumbItem key={path}>
                  {isClient ? (
                    <BreadcrumbPage className='capitalize'>
                      {label}
                    </BreadcrumbPage>
                  ) : (
                    <Skeleton className='w-24 h-5' />
                  )}
                </BreadcrumbItem>
                {i !== breadcrumbs.length - 1 ? (
                  <>
                    {isClient ? (
                      <BreadcrumbSeparator />
                    ) : (
                      <Skeleton className='size-3' />
                    )}
                  </>
                ) : null}
              </div>
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
