import { cookies } from 'next/headers'
import { ReactNode } from 'react'

import { isAuthenticated } from '@/utils/auth'

import BreadcrumbProvider from '@/providers/breadcrumbs/breadcrumb-provider'
import { OrganizationProvider } from '@/providers/organization-provider'

import AppHeader from '@/components/layout/app-nav/app-header'
import AppSidebar from '@/components/layout/app-nav/app-sidebar'
import PageLayout from '@/components/layout/page-layout'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'

const Layout = async ({
  children,
  breadcrumbs,
}: {
  children: ReactNode
  breadcrumbs: ReactNode
}) => {
  const { allowed } = await isAuthenticated()

  if (!allowed) return null

  const cookieStore = await cookies()
  const sidebarOpen = cookieStore.get('sidebar_state')?.value === 'true'

  return (
    <div className='[--header-height:calc(3rem)]'>
      <BreadcrumbProvider>
        <OrganizationProvider>
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
  )
}

export default Layout
