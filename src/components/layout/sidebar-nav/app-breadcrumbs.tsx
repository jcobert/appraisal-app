'use client'

import Link from 'next/link'
import { FC, useMemo } from 'react'
import { useIsClient } from 'usehooks-ts'

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

type CrumbMeta = { segment: string; name: string; path: string }

export type AppBreadcrumbsProps = {
  segments: string[]
}

const buildCrumbs = (segments: string[]) => {
  return segments?.reduce((prev, curr, i, arr) => {
    const parentPath = arr?.slice(0, i)?.join('/')
    const fullPath = `${i ? '/' : ''}${parentPath}/${curr}`
    const crumb = {
      segment: curr,
      path: fullPath,
      name: '',
    } satisfies (typeof prev)[number]
    const crumbs = prev.concat(crumb)
    return crumbs
  }, [] as CrumbMeta[])
}

const AppBreadcrumbs: FC<AppBreadcrumbsProps> = ({ segments }) => {
  const crumbs = useMemo(() => buildCrumbs(segments), [segments])
  const { crumbs: customCrumbs } = useBreadcrumbContext()
  const isClient = useIsClient()

  return (
    <Breadcrumb className='max-md:hidden'>
      <BreadcrumbList>
        {crumbs?.map((crumb, i) => {
          const custom = customCrumbs?.find((c) => c?.path === crumb?.path)
          const { name, path, segment } = custom || crumb || {}

          if (i === segments.length - 1) {
            return (
              <BreadcrumbItem key={path}>
                {isClient ? (
                  <BreadcrumbPage className='capitalize'>
                    {name || segment}
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
                      {name || segment}
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
