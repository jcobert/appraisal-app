import { HydrationBoundary, dehydrate } from '@tanstack/react-query'
import { cookies } from 'next/headers'
import { ReactNode } from 'react'

import { SidebarInset, SidebarProvider } from '@repo/ui'

import {
  handleGetOrganization,
  handleGetOrganizationPermissions,
  handleGetUserOrganizations,
} from '@/lib/db/handlers/organization-handlers'
import { handleGetActiveUserProfile } from '@/lib/db/handlers/user-handlers'

import { isAuthenticated } from '@/utils/auth'
import { isStatusCodeSuccess } from '@/utils/fetch'
import { createQueryClient } from '@/utils/query'

import BreadcrumbProvider from '@/providers/breadcrumbs/breadcrumb-provider'
import { OrganizationProvider } from '@/providers/organization-provider'

import AppHeader from '@/components/layout/app-nav/app-header'
import AppSidebar from '@/components/layout/app-nav/app-sidebar'
import PageLayout from '@/components/layout/page-layout'

import { getActiveOrgCookieName } from '@/hooks/use-stored-settings'

import {
  organizationsQueryKey,
  permissionsQueryKey,
  usersQueryKey,
} from '@/configuration/react-query/query-keys'

const Layout = async ({
  children,
  // breadcrumbs,
}: {
  children: ReactNode
  // breadcrumbs: ReactNode
}) => {
  const { allowed, user } = await isAuthenticated()

  if (!allowed || !user) return null

  const cookieStore = await cookies()
  const sidebarOpen = cookieStore.get('sidebar_state')?.value === 'true'
  const activeOrgId = cookieStore.get(getActiveOrgCookieName(user.id))?.value

  const queryClient = createQueryClient()

  const prefetchQueries = [
    queryClient.prefetchQuery({
      queryKey: usersQueryKey.active,
      queryFn: async () => {
        const res = await handleGetActiveUserProfile()
        if (!isStatusCodeSuccess(res?.status)) {
          throw new Error(res?.error?.message || 'Failed to fetch active user')
        }
        return res
      },
    }),
    queryClient.prefetchQuery({
      queryKey: organizationsQueryKey.all,
      queryFn: async () => {
        const res = await handleGetUserOrganizations()
        if (!isStatusCodeSuccess(res?.status)) {
          throw new Error(
            res?.error?.message || 'Failed to fetch organizations',
          )
        }
        return res
      },
    }),
  ]

  // Prefetch active org and its permissions if we have an activeOrgId
  if (activeOrgId) {
    prefetchQueries.push(
      queryClient.prefetchQuery({
        queryKey: organizationsQueryKey.filtered({ id: activeOrgId }),
        queryFn: async () => {
          const res = await handleGetOrganization(activeOrgId)
          if (!isStatusCodeSuccess(res?.status)) {
            throw new Error(
              res?.error?.message || 'Failed to fetch active organization',
            )
          }
          return res
        },
      }),
      queryClient.prefetchQuery({
        queryKey: permissionsQueryKey.filtered({
          area: 'organization',
          organizationId: activeOrgId,
        }),
        queryFn: async () => {
          const res = await handleGetOrganizationPermissions(activeOrgId)
          if (!isStatusCodeSuccess(res?.status)) {
            throw new Error(
              res?.error?.message || 'Failed to fetch permissions',
            )
          }
          return res
        },
      }),
    )
  }

  await Promise.all(prefetchQueries)

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <div className='[--header-height:calc(3rem)]'>
        <BreadcrumbProvider>
          <OrganizationProvider
            userId={user?.id}
            initialActiveOrgId={activeOrgId}
          >
            <SidebarProvider
              className='flex flex-col h-full'
              defaultOpen={sidebarOpen}
            >
              <AppHeader />
              <div className='flex flex-1 h-full'>
                <AppSidebar />
                <SidebarInset>
                  {/* <SidebarInsetHeader /> */}
                  <PageLayout
                    defaultLayout={false}
                    mainClassName='flex-auto'
                    pageClassName='p-4'
                  >
                    {children}
                  </PageLayout>
                </SidebarInset>
              </div>
            </SidebarProvider>
          </OrganizationProvider>
        </BreadcrumbProvider>
      </div>
    </HydrationBoundary>
  )
}

export default Layout
