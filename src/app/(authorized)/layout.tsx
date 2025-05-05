import { ReactNode } from 'react'

import Sidebar from '@/components/layout/nav/sidebar/sidebar'

const Layout = ({ children }: { children: ReactNode }) => {
  return (
    <div className='flex h-full'>
      <Sidebar />
      <div className='flex-auto h-full'>{children}</div>
    </div>
  )
}

export default Layout
