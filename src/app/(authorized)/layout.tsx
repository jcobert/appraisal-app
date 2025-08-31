import { HydrationBoundary, dehydrate } from '@tanstack/react-query'
import { cookies } from 'next/headers'
import { ReactNode } from 'react'

import { handleGetUserOrganizations } from '@/lib/db/handlers/organization-handlers'
import { handleGetActiveUser } from '@/lib/db/handlers/user-handlers'

import { isAuthenticated } from '@/utils/auth'
import { successful } from '@/utils/fetch'
import { createQueryClient } from '@/utils/query'

import BreadcrumbProvider from '@/providers/breadcrumbs/breadcrumb-provider'
import { OrganizationProvider } from '@/providers/organization-provider'

import AppHeader from '@/components/layout/app-nav/app-header'
import AppSidebar from '@/components/layout/app-nav/app-sidebar'
import PageLayout from '@/components/layout/page-layout'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'

import { organizationsQueryKey } from '@/features/organization/hooks/use-get-organizations'
import { usersQueryKey } from '@/features/user/hooks/use-get-user-profile'

const Layout = async ({
  children,
  breadcrumbs,
}: {
  children: ReactNode
  breadcrumbs: ReactNode
}) => {
  const { allowed, user } = await isAuthenticated()

  if (!allowed || !user) return null

  const cookieStore = await cookies()
  const sidebarOpen = cookieStore.get('sidebar_state')?.value === 'true'

  const queryClient = createQueryClient()

  await Promise.all([
    queryClient.prefetchQuery({
      queryKey: usersQueryKey.active,
      queryFn: async () => {
        const res = await handleGetActiveUser()
        if (!successful(res?.status)) {
          throw new Error(res?.error?.message || 'Failed to fetch active user')
        }
        return res
      },
    }),
    queryClient.prefetchQuery({
      queryKey: organizationsQueryKey.all,
      queryFn: async () => {
        const res = await handleGetUserOrganizations()
        if (!successful(res?.status)) {
          throw new Error(
            res?.error?.message || 'Failed to fetch organizations',
          )
        }
        return res
      },
    }),
  ])

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <div className='[--header-height:calc(3rem)]'>
        <BreadcrumbProvider>
          <OrganizationProvider userId={user?.id}>
            <SidebarProvider
              className='flex flex-col h-full'
              defaultOpen={sidebarOpen}
            >
              <AppHeader>{breadcrumbs}</AppHeader>
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
