import { redirect } from 'next/navigation'
import { ReactNode } from 'react'

import { isAuthenticated } from '@/utils/auth'

import PageLayout from '@/components/layout/page-layout'

const Layout = async ({ children }: { children: ReactNode }) => {
  const { allowed } = await isAuthenticated()

  if (!allowed) {
    redirect('/api/auth/login')
  }

  return <PageLayout mainClassName='h-screen'>{children}</PageLayout>
}

export default Layout
