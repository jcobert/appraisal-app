import { cookies } from 'next/headers'
import { ReactNode } from 'react'

import BreadcrumbProvider from '@/providers/breadcrumbs/breadcrumb-provider'

import PageLayout from '@/components/layout/page-layout'
import AppHeader from '@/components/layout/sidebar-nav/app-header'
import AppSidebar from '@/components/layout/sidebar-nav/app-sidebar'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'

const Layout = async ({
  children,
  breadcrumbs,
}: {
  children: ReactNode
  breadcrumbs: ReactNode
}) => {
  const cookieStore = await cookies()
  const sidebarOpen = cookieStore.get('sidebar_state')?.value === 'true'

  return (
    <div className='[--header-height:calc(3rem)]'>
      <BreadcrumbProvider>
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
      </BreadcrumbProvider>
    </div>
  )
}

export default Layout
