import { cookies } from 'next/headers'
import { ReactNode } from 'react'

import PageLayout from '@/components/layout/page-layout'
import AppHeader from '@/components/layout/sidebar-nav/app-header'
import AppSidebar from '@/components/layout/sidebar-nav/app-sidebar'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'

const Layout = async ({ children }: { children: ReactNode }) => {
  const cookieStore = await cookies()
  const sidebarOpen = cookieStore.get('sidebar_state')?.value === 'true'

  return (
    <div className='[--header-height:calc(3rem)]'>
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
    </div>
  )
}

export default Layout
