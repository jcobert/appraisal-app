import { cookies } from 'next/headers'
import { ReactNode } from 'react'

import PageLayout from '@/components/layout/page-layout'
import AppSidebar from '@/components/layout/sidebar/app-sidebar'
import SidebarInsetHeader from '@/components/layout/sidebar/sidebar-inset-header'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'

const Layout = async ({ children }: { children: ReactNode }) => {
  const cookieStore = await cookies()
  const sidebarOpen = cookieStore.get('sidebar_state')?.value === 'true'

  return (
    <SidebarProvider className='flex h-full min-h-0' defaultOpen={sidebarOpen}>
      <AppSidebar />
      <SidebarInset>
        <SidebarInsetHeader />
        <PageLayout mainClassName='flex-auto'>{children}</PageLayout>
      </SidebarInset>
    </SidebarProvider>
  )
}

export default Layout
