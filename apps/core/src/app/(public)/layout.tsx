import { ReactNode } from 'react'

import Header from '@/components/layout/header/header'

const Layout = ({ children }: { children: ReactNode }) => {
  return (
    <div className='flex flex-col h-full min-h-dvh'>
      <Header />
      <div className='grow h-full'>{children}</div>
    </div>
  )
}

export default Layout
