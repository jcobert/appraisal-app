import { ReactNode } from 'react'

import Sidebar from '@/components/layout/nav/sidebar/sidebar'
import PageLayout from '@/components/layout/page-layout'

const Layout = ({ children }: { children: ReactNode }) => {
  return (
    <div className='flex h-full'>
      <Sidebar />
      <PageLayout mainClassName='flex-auto'>{children}</PageLayout>
    </div>
  )
}

export default Layout
